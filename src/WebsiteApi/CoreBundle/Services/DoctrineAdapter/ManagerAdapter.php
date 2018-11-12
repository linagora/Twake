<?php

namespace WebsiteApi\CoreBundle\Services\DoctrineAdapter;

use WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\DriverManager;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\Repository\DefaultRepositoryFactory;
use Doctrine\ORM\Tools\Setup;

class ManagerAdapter
{

    public function __construct($doctrine_manager)
    {
        $this->manager = $doctrine_manager;
    }

    public function getEntityManager()
    {
        $paths = array(__DIR__ . "/entity/");
        $isDevMode = true;
        // the connection configuration

        /*
        $cluster   = Cassandra::cluster()                 // connects to localhost by default
                    ->withContactPoints("scylladb")
                    ->build();
        $keyspace  = 'system';
        $session   = $cluster->connect($keyspace);        // create session, optionally scoped to a keyspace
        $statement = new Cassandra\SimpleStatement(       // also supports prepared and batch statements
            'SELECT * FROM system_schema.keyspaces'
        );
        $future    = $session->executeAsync($statement);  // fully asynchronous and easy parallel execution
        $result    = $future->get();                      // wait for the result, with an optional timeout

        foreach ($result as $row) {                       // results and rows implement Iterator, Countable and ArrayAccess
            printf("The keyspace %s, replication seems to be %s\n", $row['keyspace_name'], json_encode($row['replication']));
        }
        */

        $dbParams = array(
            'driver' => "pdo_cassandra",
            'host' => "scylladb",
            'port' => "9160",
            'dbname' => "Twake",
        );
        $config = Setup::createAnnotationMetadataConfiguration($paths, $isDevMode, null, null, false);
        $conn = DriverManager::getConnection($dbParams, $config);

        $entityManager = EntityManager::create($conn, $config);
        return $entityManager;
    }

    public function getManager()
    {
        return $this->getEntityManager();
    }

    public function clear()
    {
        return $this->manager->clear();
    }

    public function flush()
    {

        foreach ($this->manager->getUnitOfWork()->getScheduledEntityInsertions() as $insert) {
            error_log(get_class($insert));
        }


        try {

            //$a = $this->manager->flush();
        } catch (\Exception $e) {
            error_log($e);
            die("ERROR with flush");
        }
        return $a;
    }

    public function remove($object)
    {
        return $this->manager->remove($object);
    }

    public function persist($object)
    {
        return $this->manager->persist($object);
    }

    public function getRepository($name)
    {
        $em = $this->getEntityManager();
        $factory = new DefaultRepositoryFactory($em, $name);
        return $factory->getRepository($em, $name);
    }

    public function createQueryBuilder($qb = null)
    {
        return $this->manager->createQueryBuilder($qb);
    }

}
