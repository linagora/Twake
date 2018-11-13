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
            "cassandra_timeuuid" => "timeuuid"
        );
        return isset($conversionFor[$type]) ? $conversionFor[$type] : $type;
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
        $tables = $keyspace->tables();

        foreach ($entities as $entity) {

            $table_name = $entity->getTableName();

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
                    $mapping["type"] = "timeuuid";
                }

                $create_table .= "(\"" . $identifier . "\" " . $this->convertType($mapping["type"]) . " PRIMARY KEY)";

                $connection->exec($create_table);
            }

            //TODO Add new columns


        }

    }

}