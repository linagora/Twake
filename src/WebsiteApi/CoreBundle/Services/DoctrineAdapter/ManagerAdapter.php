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
        $this->doctrine_manager = $doctrine_manager;
        $this->database_configuration = Array();//$doctrine_manager->getConnection();
        $this->manager = null;
    }

    public function getEntityManager()
    {

        if ($this->manager) {
            return $this->manager;
        }

        $paths = array(__DIR__ . "/../../../");
        $isDevMode = true;
        $config = Setup::createAnnotationMetadataConfiguration($paths, $isDevMode, null, null, false);
        $conn = DriverManager::getConnection(Array(
            'driver' => "pdo_mysql", //$this->database_configuration["driver"],
            'host' => "mysql", //$this->database_configuration["host"],
            'port' => "3306", //$this->database_configuration["port"],
            'dbname' => "Twake", //$this->database_configuration["dbname"],
            'user' => "root", //$this->database_configuration["user"],
            'password' => "root", //$this->database_configuration["password"],
            'twake_types' => Array(
                'twake_float' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\CassandraFloatType',
                'twake_datetime' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\CassandraDateTimeType',
                'twake_timeuuid' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\CassandraTimeUUIDType',
                'twake_boolean' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\CassandraBooleanType'
            )
        ), $config);

        $entityManager = EntityManager::create($conn, $config);

        $this->manager = $entityManager;
        return $this->manager;
    }

    public function getManager()
    {
        return $this->getEntityManager();
    }

    public function clear()
    {
        return $this->getEntityManager()->clear();
    }

    public function flush()
    {

        try {
            $a = $this->manager->flush();
        } catch (\Exception $e) {
            error_log($e);
            die("ERROR with flush");
        }
        return $a;
    }

    public function remove($object)
    {
        return $this->getEntityManager()->remove($object);
    }

    public function persist($object)
    {
        return $this->getEntityManager()->persist($object);
    }

    public function getRepository($name)
    {
        $metadata = $this->doctrine_manager->getClassMetadata($name);
        $name = $metadata->getName();
        $em = $this->getEntityManager();
        $factory = new DefaultRepositoryFactory($em, $name);
        return $factory->getRepository($em, $name);
    }

    public function createQueryBuilder($qb = null)
    {
        return $this->getEntityManager()->createQueryBuilder($qb);
    }

}
