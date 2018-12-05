<?php

namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use Doctrine\DBAL\Tools\Console\Helper\ConnectionHelper;
use Doctrine\ORM\Tools\Console\Helper\EntityManagerHelper;
use WebsiteApi\WorkspacesBundle\Entity\Level;
use Doctrine\ORM\Tools\Console\Command\SchemaTool\UpdateCommand;
use Symfony\Component\Console\Helper\HelperSet;
use Symfony\Component\Console\Input\InputOption;
use Cassandra;

class TwakeSchemaUpdateCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this
            ->setName("twake:schema:update")
            ->setDescription("Update table schemas using configured database system (cassandra or mysql")
            ->addOption('complete', null, InputOption::VALUE_NONE, 'If defined, all assets of the database which are not relevant to the current metadata will be dropped.')
            ->addOption('dump-sql', null, InputOption::VALUE_NONE, 'Dumps the generated SQL statements to the screen (does not execute them).')
            ->addOption('force', 'f', InputOption::VALUE_NONE, 'Causes the generated SQL statements to be physically executed against your database.');
    }

    private function convertType($type)
    {
        $conversionFor = Array(
            "string" => "text",
            "twake_timeuuid" => "timeuuid",
            "array" => "text",
            "twake_boolean" => "tinyint",
            "boolean" => "tinyint",
            "text" => "text",
            "twake_float" => "float",
            "integer" => "int",
            "bigint" => "bigint",
            "decimal" => "decimal",
            "twake_datetime" => "timestamp",
            "blob" => "blob"
        );
        return isset($conversionFor[$type]) ? $conversionFor[$type] : "ERROR";
    }

    /**
     * @param InputInterface $input
     * @param OutputInterface $output
     * @return int|null|void
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $mysql_doctrine = $this->getContainer()->get('doctrine');
        $mysql_em = $mysql_doctrine->getManager();

        $doctrine = $this->getContainer()->get('app.twake_doctrine');
        $em = $doctrine->getManager();
        $connection = $em->getConnection();
        $connection = $connection->getWrappedConnection();


        if ($this->getContainer()->getParameter("database_driver") == "pdo_mysql") {

            $updateCommand = new UpdateCommand();
            $updateCommand->setHelperSet(new HelperSet());
            $helperSet = $updateCommand->getHelperSet();
            $helperSet->set(new ConnectionHelper($mysql_em->getConnection()), 'db');
            $helperSet->set(new EntityManagerHelper($mysql_em), 'em');

            $updateCommand->execute($input, $output);

            return;
        }

        $entities = array();
        $meta = $mysql_em->getMetadataFactory()->getAllMetadata();
        foreach ($meta as $m) {
            $entities[] = $m;
        }

        $schema = $connection->getSchema();
        $keyspace = $schema->keyspace(strtolower($connection->getKeyspace()));

        $ignored_cols = 0;

        foreach ($entities as $entity) {

            $table_name = $entity->getTableName();
            $fields = Array();
            $indexed_fields = Array();
            foreach ($entity->getFieldNames() as $_fieldname) {

                $mapping = Array();
                if (!$entity->hasAssociation($_fieldname)) {
                    $mapping = $entity->getFieldMapping($_fieldname);
                } else {
                    $mapping["type"] = "timeuuid";
                }

                if (isset($mapping["columnName"])) {
                    $fieldname = $mapping["columnName"];
                }

                if (isset($mapping["options"]) && isset($mapping["options"]["index"]) && $mapping["options"]["index"]) {
                    $indexed_fields[$fieldname] = true;
                }

                if (strtolower($fieldname) != $fieldname) {
                    $ignored_cols++;
                    error_log("ERROR (IGNORING COLUMN) ! Column names MUST be snakecase and lowercase ! (" . $fieldname . " in " . $entity->getName() . ")");
                    continue;
                }

                $type = $this->convertType($mapping["type"]);
                if ($type == "ERROR") {
                    error_log("ERROR (IGNORING COLUMN) ! Type " . $mapping["type"] . " is not allowed with Cassandra implementation (in " . $entity->getName() . ")");
                    continue;
                }

                $fields[$fieldname] = $type;
            }

            foreach ($entity->getAssociationNames() as $_fieldname) {

                $fieldname = $_fieldname;

                $mapping = $entity->getAssociationMapping($fieldname);

                if (isset($mapping["columnName"])) {
                    $fieldname = $mapping["columnName"];
                }

                if (strtolower($fieldname) != $fieldname) {
                    $ignored_cols++;
                    error_log("ERROR (IGNORING COLUMN) ! Column names MUST be snakecase and lowercase ! (" . $fieldname . " in " . $entity->getName() . ")");
                    continue;
                }

                $fieldname = $fieldname . "_id";

                if (isset($mapping["options"]) && isset($mapping["options"]["index"]) && $mapping["options"]["index"]) {
                    $indexed_fields[$fieldname] = true;
                }

                $fields[$fieldname] = "timeuuid";
            }

            if (strtolower($table_name) != $table_name) {
                error_log("ERROR (IGNORING TABLE) ! Tables names MUST be snakecase and lowercase ! (" . $entity->getName() . ")");
                continue;
            }

            if (!$keyspace->table($table_name)) {
                //Create table
                $create_table = "CREATE TABLE " . strtolower($connection->getKeyspace()) . ".\"" . $table_name . "\" ";

                //Add Primary key
                $identifiers = $entity->getIdentifier();
                if (count($identifiers) != 1) {
                    error_log("ERROR (IGNORING TABLE) ! Tables MUST have exactly one identifier for this implementation with Cassandra ! (in " . $entity->getName() . " " . json_encode($identifiers) . ")");
                    continue;
                }
                $identifier = $identifiers[0];

                $mapping = Array();
                if (!$entity->hasAssociation($identifier)) {
                    $mapping = $entity->getFieldMapping($identifier);
                    if (!in_array($mapping["type"], Array("twake_timeuuid", "string", "blob"))) {
                        error_log("ERROR (IGNORING TABLE) ! Tables index MUST be of type twake_timeuuid or string or blob ! (in " . $entity->getName() . ")");
                        continue;
                    }
                } else {
                    $mapping["columnName"] = $identifier . "_id";
                    $mapping["type"] = "twake_timeuuid";
                }

                $identifier = $mapping["columnName"];

                $create_table .= "(";
                $columns = Array();

                $columns[] = "\"" . $identifier . "\" " . $this->convertType($mapping["type"]) . " PRIMARY KEY";
                foreach ($fields as $fieldname => $type) {
                    if ($fieldname != $identifier) {
                        $columns[] = "\"" . $fieldname . "\" " . $type . "";
                    }
                }
                $columns = join(", ", $columns);

                $create_table .= $columns . " )";

                $connection->exec($create_table);
            }

            $cassandra_table = $keyspace->table($table_name);
            if (!$cassandra_table) {
                continue;
            }

            //Add columns
            $columns_to_add = Array();
            $alter_command = "ALTER TABLE " . strtolower($connection->getKeyspace()) . ".\"" . $table_name . "\" ";
            foreach ($fields as $fieldname => $type) {

                $existing_col = $cassandra_table->column($fieldname);

                if ($existing_col) {
                    if ($existing_col->type() != $type) {
                        $command = $alter_command . " ALTER \"" . $fieldname . "\" TYPE " . $type;
                        $connection->exec($command);
                    }
                } else {
                    /* MULTIPLE ADD COLUMN NOT SUPORTED FOR CURRENT SCYLLADB VERSION*/
                    $add = "\"" . $fieldname . "\" " . $type . "";
                    $connection->exec($alter_command . " ADD " . $add);
                    $columns_to_add[] = $add;
                }

            }

            /* MULTIPLE ADD COLUMN NOT SUPORTED FOR CURRENT SCYLLADB VERSION
            if(count($columns_to_add) > 0){
                $columns_to_add = join(", ", $columns_to_add);
                $command = $alter_command . " ADD ".$columns_to_add."";
                $connection->exec($command);
            }*/


            $index_base_command = "CREATE CUSTOM INDEX IF NOT EXISTS ON " . strtolower($connection->getKeyspace()) . ".\"" . $table_name . "\" ";
            if (isset($entity->table["indexes"])) {
                foreach ($entity->table["indexes"] as $index_name => $data) {
                    $columns = $data["columns"];
                    if (count($columns) == 1) {
                        $indexed_fields[$columns[0]] = true;
                    } else {
                        $command = $index_base_command . "(" . join(",", $columns) . ") USING ";
                        //$connection->exec($command);
                    }
                }
            }

            $index_base_command = "CREATE INDEX IF NOT EXISTS ON " . strtolower($connection->getKeyspace()) . ".\"" . $table_name . "\" ";
            foreach ($indexed_fields as $indexed_field => $dummy) {
                $command = $index_base_command . "(" . $indexed_field . ")";
                $connection->exec($command);
            }

        }
        error_log("Ignored cols = " . $ignored_cols);

    }

}