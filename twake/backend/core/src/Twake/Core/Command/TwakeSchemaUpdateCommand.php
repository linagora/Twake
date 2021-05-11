<?php

namespace Twake\Core\Command;

use Cassandra;
use Doctrine\DBAL\Tools\Console\Helper\ConnectionHelper;
use Doctrine\ORM\Tools\Console\Command\SchemaTool\UpdateCommand;
use Doctrine\ORM\Tools\Console\Helper\EntityManagerHelper;
use Common\Commands\ContainerAwareCommand;
use Doctrine\ORM\Tools\Setup;
use Symfony\Component\Console\Helper\HelperSet;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Discussion\Entity\Channel;
use Twake\Market\Entity\LinkAppWorkspace;
use Twake\Workspaces\Entity\Level;
use Doctrine\ORM\EntityManager;

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

    /**
     * @param InputInterface $input
     * @param OutputInterface $output
     * @return int|null|void
     */
    protected function execute()
    {

        @file_put_contents("/twake.status.db_init", "0");

        //Wait for scylladb connection
        error_log("\n⏳Waiting for ScyllaDB/Cassandra connection");
        $connected = false;
        $iteration = 0;
        while(!$connected && $iteration < 12 * 6){
          try{
            $doctrine = $this->getApp()->getServices()->get('app.twake_doctrine');
            $em = $doctrine->getManager();
            $connection = $em->getConnection();
            $connection = $connection->getWrappedConnection();
            $connected = true;
          }catch(\Exception $e){
            $connected = false;
          }
          if(!$connected){
            error_log("... not found, retry in 5 seconds (timeout 360s)");
            sleep(5);
          }
          $iteration++;
        }
        if(!$connected){
          error_log("\n💥 Unable to join ScyllaDB/Cassandra !\n");
          return;
        }

        $doctrine = $this->getApp()->getServices()->get('app.twake_doctrine');
        $em = $doctrine->getManager();
        $connection = $em->getConnection();
        $connection = $connection->getWrappedConnection();

        $entities = array();

        $meta = $em->getMetadataFactory()->getAllMetadata();
        foreach ($meta as $m) {
            $entities[] = $m;
        }

        $schema = $connection->getSchema();
        $keyspace = $schema->keyspace(strtolower($connection->getKeyspace()));
        $is_cassandra = $this->getApp()->getContainer()->getParameter("db.is_cassandra", false);

        $ignored_cols = 0;
        $viable_indexes = [];

        foreach ($entities as $entity) {

            $table_name = $entity->getTableName();
            error_log($table_name);
            $fields = Array();
            $indexed_fields = Array();

            $custom_keys_names = false;
            $custom_keys = false;
            $custom_keys_order = false;
            $custom_keys_where = false;
            if (isset($entity->table["options"]) && isset($entity->table["options"]["scylladb_keys"])) {
                if (isset($entity->table["options"]["scylladb_keys"][0]) && count($entity->table["options"]["scylladb_keys"][0]) > 0) {
                    $_custom_keys = $entity->table["options"]["scylladb_keys"];

                    $custom_keys = Array();
                    $custom_keys_names = Array();
                    $custom_keys_order = Array();
                    $custom_keys_where = Array();

                    $j = 0;
                    foreach ($_custom_keys as $_custom_key) {
                        $keys = [];
                        $i = 0;
                        $custom_keys_order_tmp = Array();
                        $custom_keys_where_tmp = Array();
                        $custom_name = null;
                        foreach ($_custom_key as $key => $order) {

                            if ($key == "__name") {
                                $custom_name = $order;
                                continue;
                            }

                            $value = false;
                            if ($order != "ASC" and $order != "DESC") {
                                $value = $order;
                                $order = "ASC";
                            }

                            if (is_array($key)) {
                                $keys[] = "(" . join(", ", $key) . ")";
                            } else {
                                $keys[] = $key;
                            }

                            $custom_keys_where_tmp[] = $key . (($value === false) ? " IS NOT NULL" : " = " . $value);
                            if ($i > 0) {
                                $custom_keys_order_tmp[] = $key . " " . $order;
                            }
                            $i++;

                        }
                        $custom_keys[] = join(", ", $keys);
                        $custom_keys_order[] = join(", ", $custom_keys_order_tmp);
                        $custom_keys_where[] = join(" AND ", $custom_keys_where_tmp);
                        $custom_keys_names[] = $custom_name;
                    }

                }
            }

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

                $fieldname = $fieldname . "_id";

                if(isset($mapping["joinColumns"][0]["name"])){
                    $fieldname = $mapping["joinColumns"][0]["name"];
                }

                if (strtolower($fieldname) != $fieldname) {
                    $ignored_cols++;
                    error_log("ERROR (IGNORING COLUMN) ! Column names MUST be snakecase and lowercase ! (" . $fieldname . " in " . $entity->getName() . ")");
                    continue;
                }

                if (!(isset($mapping["id"]) && $mapping["id"])) { //isset($mapping["options"]) && isset($mapping["options"]["index"]) && $mapping["options"]["index"]) {
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
                if (!$custom_keys && count($identifiers) != 1) {
                    error_log("ERROR (IGNORING TABLE) ! Tables MUST have exactly one identifier for this implementation with Cassandra ! (in " . $entity->getName() . " " . json_encode($identifiers) . ")");
                    continue;
                }
                $identifier = $identifiers[0];

                $mapping = Array();
                if (!$entity->hasAssociation($identifier)) {
                    $mapping = $entity->getFieldMapping($identifier);
                    if (!in_array($mapping["type"], Array("twake_timeuuid", "twake_uuid", "string", "blob", "twake_string", "twake_bigint"))) {
                        error_log("ERROR (IGNORING TABLE) ! Tables index MUST be of type twake_timeuuid or string, or twake_string or blob or twake_bigint ! (in " . $entity->getName() . ")");
                        continue;
                    }
                } else {
                    $mapping["columnName"] = $identifier . "_id";
                    $mapping["type"] = "twake_timeuuid";
                }

                $identifier = $mapping["columnName"];

                $create_table .= "(";
                $columns = Array();

                $columns[] = "\"" . $identifier . "\" " . $this->convertType($mapping["type"]) . ($custom_keys ? "" : " PRIMARY KEY");
                foreach ($fields as $fieldname => $type) {
                    if ($fieldname != $identifier) {
                        $columns[] = "\"" . $fieldname . "\" " . $type . "";
                    }
                }
                $columns = join(", ", $columns);

                $create_table .= $columns;

                if ($custom_keys) {
                    $create_table .= ", PRIMARY KEY (" . $custom_keys[0] . ")";
                }

                $create_table .= ")";

                if ($custom_keys_order && $custom_keys_order[0]) {
                    $create_table .= " WITH CLUSTERING ORDER BY (" . $custom_keys_order[0] . ")";
                }

                $connection->exec($create_table);

                $schema = $connection->getSchema();
                $keyspace = $schema->keyspace(strtolower($connection->getKeyspace()));
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

            if ($custom_keys) {

                //Cannot update main primary key
                array_shift($custom_keys);
                array_shift($custom_keys_order);
                array_shift($custom_keys_where);
                array_shift($custom_keys_names);

                if (count($custom_keys) > 0) {

                    foreach ($custom_keys as $i => $key) {

                        $index_name = $table_name . "_index_" . str_replace([",", " "], ["_", ""], $key);

                        if (strpos($key, ",") !== false) {
                            if ($custom_keys_names[$i]) {
                                $index_name = $custom_keys_names[$i] . "_custom_index";
                            } else {
                                $index_name .= "_composite";
                            }

                            if($is_cassandra){
                                $index_name = "index_".md5($index_name);
                            }

                            $command = "CREATE MATERIALIZED VIEW IF NOT EXISTS " . strtolower($connection->getKeyspace()) . ".\"";
                            $command .= $index_name . "\" AS ";
                            $command .= " SELECT " . $key;
                            $command .= " FROM " . strtolower($connection->getKeyspace()) . ".\"" . $table_name . "\" ";
                            $command .= " WHERE " . $custom_keys_where[$i];
                            $command .= " PRIMARY KEY (" . $key . ")";
                            $command .= " WITH CLUSTERING ORDER BY (" . $custom_keys_order[$i] . ")";
                        } else {

                            if ($custom_keys_names[$i]) {
                                $index_name = $custom_keys_names[$i] . "_custom_index";
                            } else {
                                $index_name .= "_simple";
                            }

                            if($is_cassandra){
                                $index_name = "index_".md5($index_name);
                            }

                            $command = "CREATE INDEX IF NOT EXISTS \"";
                            $command .= $index_name . "\" ON " . strtolower($connection->getKeyspace()) . ".\"" . $table_name . "\" ";
                            $command .= "(\"" . $key . "\")";
                        }
                        $connection->exec($command);
                        $viable_indexes[] = $index_name;
                    }

                }

            } else {

                if (isset($entity->table["options"]["indexes"])) {
                    foreach ($entity->table["options"]["indexes"] as $index_name => $data) {
                        $columns = $data->columns;
                        if (count($columns) == 1) {
                            $indexed_fields[$columns[0]] = true;
                        }
                    }
                }

                foreach ($indexed_fields as $indexed_field => $dummy) {

                    $index_name = $table_name . "_index_" . str_replace([",", " "], ["_", ""], $indexed_field) . "_simple_2";

                    $index_base_command = "CREATE INDEX IF NOT EXISTS \"" . $index_name . "\" ON " . strtolower($connection->getKeyspace()) . ".\"" . $table_name . "\" ";

                    $command = $index_base_command . "(\"" . $indexed_field . "\")";
                    $connection->exec($command);

                    $viable_indexes[] = $index_name;
                }

            }

        }

        error_log("Indexes = " . count($viable_indexes));
        error_log("Ignored cols = " . $ignored_cols);

        @file_put_contents("/twake.status.db_init", "1");

    }

    private function convertType($type)
    {
        $conversionFor = Array(
            "string" => "text",
            "twake_text" => "text",
            "twake_no_salt_text" => "text",
            "twake_string" => "text",
            "twake_timeuuid" => "timeuuid",
            "twake_uuid" => "timeuuid",
            "array" => "text",
            "twake_boolean" => "tinyint",
            "tinyint" => "tinyint",
            "boolean" => "tinyint",
            "text" => "text",
            "twake_float" => "float",
            "integer" => "int",
            "bigint" => "bigint",
            "twake_bigint" => "bigint",
            "twake_counter" => "counter",
            "decimal" => "decimal",
            "twake_datetime" => "timestamp",
            "blob" => "blob"
        );
        return isset($conversionFor[$type]) ? $conversionFor[$type] : "ERROR";
    }

}
