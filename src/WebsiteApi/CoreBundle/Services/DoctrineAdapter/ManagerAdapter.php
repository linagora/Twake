<?php

namespace WebsiteApi\CoreBundle\Services\DoctrineAdapter;

use Reprovinci\DoctrineEncrypt\Subscribers\DoctrineEncryptSubscriber;
use WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\DriverManager;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\Repository\DefaultRepositoryFactory;
use Doctrine\ORM\Tools\Setup;
use Doctrine\DBAL\Types\Type;
use Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator;
use DateTime;

use WebsiteApi\CoreBundle\Services\StringCleaner;

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
        $this->generator = null;

        if (!$this->es_server && !defined("ELASTICSEARCH_INSTALL_MESSAGE_SHOWED") && php_sapi_name() === 'cli') {
            define("ELASTICSEARCH_INSTALL_MESSAGE_SHOWED", true);
            error_log("INFO: Installation configured without elastic search");
        }
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
                'twake_bigint' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'BigIntType',
                'twake_counter' => 'WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'CounterType'
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

    /** !Caution! : thin ttl will be used on the first insert in the next flush ! */
    public function useTTLOnFirstInsert($ttl)
    {
        $this->getManager()->getConnection()->getWrappedConnection()->useTTLOnFirstInsert($ttl);
    }

    public function flush()
    {
        //ElasticSearch
        foreach ($this->es_removes as $es_remove) {
            $this->es_remove($es_remove, $es_remove->getEsType(), $es_remove->getEsIndex());
        }

        $this->es_removes = Array();
        foreach ($this->es_updates as $id => $es_update) {
            $this->es_put($es_update, $es_update->getEsType(), $es_update->getEsIndex());
            $es_update->updatePreviousIndexationArray();

        }

        $this->es_updates = Array();

        try {
            $a = $this->manager->flush();
        } catch (\Exception $e) {
            error_log($e);
            error_log("ERROR FLUSH");
            die("ERROR with flush");
        }

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

    public function getReference($ent, $id)
    {
        $res = null;
        try {
            $res = $this->getEntityManager()->getReference($ent, $id);
        } catch (\Exception $e) {
            error_log($e);
            die("ERROR with persist");
        }

        return $res;
    }

    public function merge($object)
    {
        $res = null;
        try {
            $res = $this->getEntityManager()->merge($object);
        } catch (\Exception $e) {
            error_log($e);
            die("ERROR with persist");
        }

        return $res;
    }

    public function persist($object)
    {

        if (!$this->generator) {
            $this->generator = new UuidOrderedTimeGenerator();
        }
        if (method_exists($object, "getId") && (!$object->getId() || (is_object($object->getId()) && method_exists($object->getId(), "isNull") && $object->getId()->isNull()))) {
            $object->setId($this->generator->generate($this->getEntityManager(), $object));
        }


        if (method_exists($object, "getEsIndexed")) {
            //This is a searchable object
            if (method_exists($object,"getLock()") ){
                if($object->getLock() == true) {
                    $this->es_updates[$object->getId().""] = $object;
                    unset($this->es_removes[$object->getId() . ""]);
                    $object->setEsIndexed(true);
                }
            }
            else{
                if (!$object->getEsIndexed() || $object->changesInIndexationArray()) {
                    $this->es_updates[$object->getId().""] = $object;
                    unset($this->es_removes[$object->getId().""]);
                    $object->setEsIndexed(true);
                }
            }
        }

        $res = null;
        try {
            $res = $this->getEntityManager()->persist($object);
        } catch (\Exception $e) {
            error_log($e);
            die("ERROR with persist");
        }

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

    //update for important keywords from title or extension of a file only in ES to not repeat info in scyllaDB

    public function update_ES_keyword($keywords,$word){
//        error_log(print_r($keywords,true));
//        error_log(print_r($word,true));

        $keywords[] = Array(
            "keyword" => $word,
            "score" => 1.1
        );
        return $keywords;
    }

    function validateDate($date, $format = 'Y-m-d')
    {
        $d = DateTime::createFromFormat($format, $date);
        // The Y ( 4 digits year ) returns TRUE for any integer with any number of digits so changing the comparison from == to === fixes the issue.
        return $d && $d->format($format) === $date;
    }

    public function es_put($entity, $index, $server = "twake")
    {

        //error_log("PASSAGE DANS ES PUT");
//        error_log(print_r($entity->getId()."",true));

        if (!$this->es_server) {
            return;
        }

        if (is_array($entity)) {
            $id = $entity["id"];
            $data = $entity["data"];
            if (!is_array($data)) {
                $data = Array("content" => $data);
            }
        } else {
            $id = $entity->getId()."";
            if (method_exists($entity, "getIndexationArray")) {
                $data = $entity->getIndexationArray();
            }
            if (method_exists($entity, "getContentKeywords") && is_array($entity->getContentKeywords())) {
                $keywords = $entity->getContentKeywords();
                //error_log(print_r($keywords,true));
                //partie sur la verification du format des mots clés
                $keywords_verif = Array();
                foreach ($keywords as $keyword_score){
                    //error_log(print_r($keyword_score,true));
                    $keys = array_keys($keyword_score);
                    if(count($keys) != 2 || $keys[0] != "keyword" || $keys[1]  != "score" ||
                        gettype($keyword_score["keyword"]) != "string" || gettype($keyword_score["keyword"]) != "string"){
                        error_log("Wrong format for keyword data");
                    }
                    else{
                        $keywords_verif[] = $keyword_score;
                    }
                }

                $name= $entity->getName();
                $keywords = $this->update_ES_keyword($keywords_verif,$name);
                $data["keywords"] = $keywords;

            }
        }

        //error_log(print_r($data,true));
        $st = new StringCleaner();
        $data = $st->simplifyInArray($data);
        $route = "http://" . $this->es_server . "/" . $index . "/_doc/" . $id;



        try {
            $this->circle->put($route, json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 1, CURLOPT_TIMEOUT => 1, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));
        } catch (\Exception $e) {
            error_log("Unable to put on ElasticSearch.");
        }

    }

    public function es_remove($entity, $index, $server = "twake")
    {

        if (!$this->es_server) {
            return;
        }

        if (is_array($entity)) {
            $id = $entity["id"];
        } else {
            $id = $entity->getId();
        }

        $route = "http://" . $this->es_server . "/" . $index . "/_doc/" . $id;

        try {
            $this->circle->delete($route, array(CURLOPT_CONNECTTIMEOUT => 1));
        } catch (\Exception $e) {
            error_log("Unable to delete on ElasticSearch.");
        }
    }


    public function es_search($options = Array(), $index = null, $server = "twake")
    {
        //var_dump($options);

        if(isset($options["scroll_id"])){
            $route = "http://" . $this->es_server . "/_search/scroll" ;
            $res = $this->circle->post($route, json_encode(Array("scroll" => "5m", "scroll_id" => $options["scroll_id"])), array(CURLOPT_CONNECTTIMEOUT => 1, CURLOPT_TIMEOUT => 1, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));
        }
        else {
            if (!$this->es_server) {

                if (isset($options["repository"]) && isset($options["fallback_keys"])) {
                    $repository = $this->getRepository($options["repository"]);

                    $filter = isset($options["fallback_filter"]) ? $options["fallback_filter"] : Array();
                    $results = $repository->findBy($filter, Array(), 500);

                    $entities = [];

                    foreach ($results as $result) {
                        $match = false;
                        foreach ($options["fallback_keys"] as $key => $query) {
                            if (strtolower(trim($query)) && strpos(strtolower($result->getAsArray()[$key]), strtolower(trim($query))) !== false) {
                                $match = true;
                            }
                        }
                        if ($match) {
                            $entities[] = $result;
                        }
                    }

                    return Array("result" => $entities);
                }
                return [];
            }
            if (isset($options["index"]) && !$type) {
                $index = $options["index"];
            }


            $route = "http://" . $this->es_server . "/" . $index . "/_doc/";
            $route .= "_search";
            $route .= "?scroll=5m"; //on spécifie un temps ou la recherche est active

            if (!isset($options["size"])) {
                $options["size"] = 10;
            }

            try {
                if (isset($options["sort"])) {
                    $res = $this->circle->post($route, json_encode(Array("size" => $options["size"], "query" => $options["query"], "sort" => $options["sort"])), array(CURLOPT_CONNECTTIMEOUT => 1, CURLOPT_TIMEOUT => 1, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));
                } else {
                    $res = $this->circle->post($route, json_encode(Array("size" => $options["size"], "query" => $options["query"])), array(CURLOPT_CONNECTTIMEOUT => 1, CURLOPT_TIMEOUT => 1, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));
                }

            } catch (\Exception $e) {
                error_log("Unable to post on ElasticSearch.");
            }
        }


        $repository = null;
        if (isset($options["repository"])) {
            $repository = $this->getRepository($options["repository"]);
        }
        //error_log(print_r($options["repository"],true));
        //error_log(print_r($repository,true));

        $res = $res->getContent();

        $result = [];
        $scroll_id = "";

        //var_dump($res);
        if ($res) {
            $res = json_decode($res, 1);
            if($res["hits"]["total"] > $options["size"] && isset($res["_scroll_id"])){
                //on a plus de 10 resultat et un ID il faut paginer
                $scroll_id = $res["_scroll_id"];
            }

            //error_log(print_r($res,true));

            if (isset($res["hits"]) && isset($res["hits"]["hits"])) {
                $res = $res["hits"]["hits"];

                foreach ($res as $object_json) {
                    if ($repository) {
                        $obj = $repository->findOneBy(Array("id" => $object_json["_id"]));
                    } else {
                        $obj = $object_json["_id"];
                    }

                    $result[] = Array($obj, isset($object_json["sort"]) ? $object_json["sort"] : 0);

                }
            }
            $result = Array("repository" => $repository, "scroll_id" => $scroll_id, "result" => $result);
        }
        return $result;

    }


}
