<?php

namespace WebsiteApi\CoreBundle\Services\DoctrineAdapter;

use Reprovinci\DoctrineEncrypt\Subscribers\DoctrineEncryptSubscriber;
use WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\DriverManager;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\Repository\DefaultRepositoryFactory;
use Doctrine\ORM\Tools\Setup;
use Doctrine\DBAL\Types\Type;
use Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator;

class ManagerAdapter
{

    public function __construct($doctrine_manager, $es_server, $circle, $driver, $host, $port, $username, $password, $dbname, $encryption_key)
    {
        $this->doctrine_manager = $doctrine_manager;
        $this->database_configuration = Array(
            "driver" => $driver,
            "host" => $host,
            "port" => $port,
            "username" => $username,
            "password" => $password,
            "dbname" => $dbname,
            "encryption_key" => $encryption_key
        );
        $this->dev_mode = true; // If false no entity generation
        $this->manager = null;

        $this->circle = $circle;
        $this->es_server = $es_server;
        $this->es_updates = Array();
        $this->es_removes = Array();
    }

    public function getEntityManager()
    {

        if ($this->manager) {
            return $this->manager;
        }

        if ($this->database_configuration["driver"] == "pdo_mysql") {
            $driver_type = "Mysql";
        } else {
            $driver_type = "Cassandra";
        }

        $paths = array(__DIR__ . "/../../../");
        $isDevMode = $this->dev_mode;
        $config = Setup::createAnnotationMetadataConfiguration($paths, $isDevMode, null, null, false);
        $conn = DriverManager::getConnection(Array(
            'driver' => $this->database_configuration["driver"],
            'host' => $this->database_configuration["host"],
            'port' => $this->database_configuration["port"],
            'dbname' => $this->database_configuration["dbname"],
            'user' => $this->database_configuration["username"],
            'password' => $this->database_configuration["password"],
            'twake_types' => Array(
                'twake_float' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'FloatType',
                'twake_datetime' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'DateTimeType',
                'twake_timeuuid' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'TimeUUIDType',
                'twake_boolean' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'BooleanType',
                'twake_text' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'TextType',
                'twake_string' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'StringType',
                'twake_bigint' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'BigIntType'
            )
        ), $config);

        $encryptedStringType = Type::getType('twake_text');
        $encryptedStringType->setEncryptionKey(pack("H*", $this->database_configuration["encryption_key"]));

        $entityManager = EntityManager::create($conn, $config);

        //Database encryption
        /*$encrypt_subscriber = new TwakeDoctrineEncryptSubscriber(
            new \Doctrine\Common\Annotations\AnnotationReader,
            new TwakeEncryptor(pack("H*", $this->database_configuration["encryption_key"]))
        );
        $eventManager = $entityManager->getEventManager();
        $eventManager->addEventSubscriber($encrypt_subscriber);*/

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

        //ElasticSearch
        foreach ($this->es_removes as $es_remove) {
            $this->es_remove($es_remove, $es_remove->getEsType(), $es_remove->getEsIndex());
        }
        $this->es_removes = Array();
        foreach ($this->es_updates as $es_update) {
            $this->es_put($es_update, $es_update->getEsType(), $es_update->getEsIndex());
            $es_update->updatePreviousIndexationArray();
        }
        $this->es_updates = Array();

        error_log("WILL LFUSH");

        try {
            $a = $this->manager->flush();
        } catch (\Exception $e) {
            error_log($e);
            error_log("ERROR LFUSH");
            die("ERROR with flush");
        }
        error_log("DID LFUSH");
        return $a;
    }

    public function remove($object)
    {
        if (method_exists($object, "getEsIndexed")) {
            //This is a searchable object
            $this->es_removes[$object->getId() . ""] = $object;
            unset($this->es_updates[$object->getId() . ""]);
        }
        return $this->getEntityManager()->remove($object);
    }

    public function persist($object)
    {

        error_log("WILL persist");

        if (!$this->generator) {
            $this->generator = new UuidOrderedTimeGenerator();
        }

        if (method_exists($object, "getId") && !$object->getId()) {
            $object->setId($this->generator->generate($this->getEntityManager(), $object));
            error_log($object->getId());
        }


        if (method_exists($object, "getEsIndexed")) {
            //This is a searchable object
            if (!$object->getEsIndexed() || $object->changesInIndexationArray()) {
                $this->es_updates[$object->getId() . ""] = $object;
                unset($this->es_removes[$object->getId() . ""]);
                $object->setEsIndexed(true);
            }
        }


        $res = null;
        try {
            $res = $this->getEntityManager()->persist($object);
        } catch (\Exception $e) {
            error_log($e);
            die("ERROR with persist");
        }
        error_log("DID persist");

        return $res;
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


    /* Elastic Search */


    public function es_put($entity, $type, $index = "twake")
    {

        if (is_array($entity)) {
            $id = $entity["id"];
            $data = $entity["data"];

            if (!is_array($data)) {
                $data = Array("content" => $data);
            }
        } else {
            $id = $entity->getId();

            if (method_exists($entity, "getIndexationArray")) {
                $data = $entity->getIndexationArray();
            } else {
                $data = $entity->getAsArray();
            }
        }

        $route = "http://" . $this->es_server . "/" . $index . "/" . $type . "/" . $id;

        $this->circle->put($route, json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));

    }

    public function es_remove($entity, $type, $index = "twake")
    {

        if (is_array($entity)) {
            $id = $entity["id"];
        } else {
            $id = $entity->getId();
        }

        $route = "http://" . $this->es_server . "/" . $index . "/" . $type . "/" . $id;

        $this->circle->delete($route);
    }

    public function es_search($options = Array(), $type = null, $index = "twake")
    {

        if (isset($options["type"]) && !$type) {
            $type = $options["type"];
        }

        $repository = null;
        if (isset($options["repository"])) {
            $repository = $this->getRepository($options["repository"]);
        }

        $route = "http://" . $this->es_server . "/" . $index . "/";
        if ($type) {
            $route .= $type . "/";
        }
        $route .= "_search";

        $res = $this->circle->post($route, json_encode(Array("query" => $options["query"])), array(CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));


        $res = $res->getContent();

        $result = [];
        if ($res) {
            $res = json_decode($res, 1);

            if (isset($res["hits"]) && isset($res["hits"]["hits"])) {
                $res = $res["hits"]["hits"];

                foreach ($res as $object_json) {
                    if ($repository) {
                        $obj = $repository->find($object_json["_id"]);
                    } else {
                        $obj = $object_json["_id"];
                    }
                    if ($obj) {
                        $result[] = $obj;
                    }
                }
            }

        }

        return $result;

    }

}
