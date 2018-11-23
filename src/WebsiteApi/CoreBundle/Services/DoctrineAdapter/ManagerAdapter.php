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
        $this->manager = null;
    }

    public function getEntityManager()
    {
        if ($this->manager) {
            return $this->manager;
        }

        $paths = array(__DIR__ . "/entity/");
        $isDevMode = true;
        // the connection configuration
        $dbParams = array(
            'driver' => "pdo_cassandra",
            'host' => "scylladb",
            'port' => "9160",
            'dbname' => "Twake",
        );
        $config = Setup::createAnnotationMetadataConfiguration($paths, $isDevMode, null, null, false);
        $conn = DriverManager::getConnection($dbParams, $config);

        $entityManager = EntityManager::create($conn, $config);

        $this->manager = $entityManager;
        return $entityManager;
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
