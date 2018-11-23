<?php

namespace WebsiteApi\CoreBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\UsersBundle\Entity\VerificationNumberMail;
use WebsiteApi\UsersBundle\Entity\Token;
use WebsiteApi\WorkspacesBundle\Entity\Level;
use Cassandra;

class CassandraSchemaUpdateCommand extends ContainerAwareCommand
{

    protected function configure()
    {
        $this
            ->setName("twake:cassandra:schema:update")
            ->setDescription("Update cassandra table schemas");
    }

    private function convertType($type)
    {
        $conversionFor = Array(
            "string" => "text",
            "cassandra_timeuuid" => "timeuuid",
            "array" => "text",
            "cassandra_boolean" => "tinyint",
            "boolean" => "tinyint",
            "text" => "text",
            "cassandra_float" => "float",
            "integer" => "int",
            "bigint" => "bigint",
            "decimal" => "decimal",
            "cassandra_datetime" => "timestamp",
            "blob" => "blob"
        );
        return isset($conversionFor[$type]) ? $conversionFor[$type] : "ERROR";
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $mysql_doctrine = $this->getContainer()->get('doctrine');
        $mysql_em = $mysql_doctrine->getManager();

        $doctrine = $this->getContainer()->get('app.doctrine_adapter');
        $em = $doctrine->getManager();
        $connection = $em->getConnection();
        $connection = $connection->getWrappedConnection();

        $entities = array();
        $meta = $mysql_em->getMetadataFactory()->getAllMetadata();
        foreach ($meta as $m) {
            $entities[] = $m;
        }

        $schema = $connection->getSchema();
        $keyspace = $schema->keyspace(strtolower($connection->getKeyspace()));

        foreach ($entities as $entity) {

            $table_name = $entity->getTableName();
            $fields = Array();
            $indexed_fields = Array();
            foreach ($entity->getFieldNames() as $fieldname) {

                $mapping = Array();
                if (!$entity->hasAssociation($fieldname)) {
                    $mapping = $entity->getFieldMapping($fieldname);
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

            foreach ($entity->getAssociationNames() as $fieldname) {


                $mapping = $entity->getAssociationMapping($fieldname);

                if (isset($mapping["columnName"])) {
                    $fieldname = $mapping["columnName"];
                }

                if (strtolower($fieldname) != $fieldname) {
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
                    if (!in_array($mapping["type"], Array("cassandra_timeuuid", "string"))) {
                        error_log("ERROR (IGNORING TABLE) ! Tables index MUST be of type cassandra_timeuuid or string ! (in " . $entity->getName() . ")");
                        continue;
                    }
                } else {
                    $mapping["type"] = "cassandra_timeuuid";
                }

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

            $index_base_command = "CREATE INDEX IF NOT EXISTS ON " . strtolower($connection->getKeyspace()) . ".\"" . $table_name . "\" ";
            foreach ($indexed_fields as $indexed_field => $dummy) {
                $command = $index_base_command . "(" . $indexed_field . ")";
                $connection->exec($command);
            }

        }

    }

}