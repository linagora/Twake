<?php

namespace Twake\Core\Services\DoctrineAdapter;

use App\App;
use DateTime;
use Doctrine\DBAL\Types\Type;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\Repository\DefaultRepositoryFactory;
use Doctrine\ORM\Tools\Setup;
use Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator;
use Twake\Core\Services\DoctrineAdapter\DBAL\Driver\PDOCassandra\CassandraConnection;
use Twake\Core\Services\DoctrineAdapter\DBAL\DriverManager;
use Twake\Core\Services\StringCleaner;

class ManagerAdapter
{

    /** @var App */
    private $app = null;

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->doctrine_manager = $app->getProviders()->get("db");
        $this->database_configuration = Array(
            "driver" => $app->getContainer()->getParameter("db.driver"),
            "host" => $app->getContainer()->getParameter("db.host"),
            "port" => $app->getContainer()->getParameter("db.port"),
            "user" => $app->getContainer()->getParameter("db.user"),
            "password" => $app->getContainer()->getParameter("db.password"),
            "dbname" => $app->getContainer()->getParameter("db.dbname"),
            "ssl" => $app->getContainer()->getParameter("db.ssl"),
            "encryption_key" => $app->getContainer()->getParameter("db.encryption_key"),
            "replication" => $app->getContainer()->getParameter("db.replication"),
        );
        $this->dev_mode = true; // If false no entity generation
        $this->manager = null;

        $this->circle = $app->getServices()->get("app.restclient");
        $this->es_server = $app->getContainer()->getParameter("es.host");
        $this->es_updates = Array();
        $this->es_removes = Array();
        $this->generator = null;

        if (!$this->es_server && !defined("ELASTICSEARCH_INSTALL_MESSAGE_SHOWED") && php_sapi_name() === 'cli') {
            define("ELASTICSEARCH_INSTALL_MESSAGE_SHOWED", true);
            error_log("INFO: Installation configured without elastic search");
        }
    }

    public function clear()
    {
        return $this->getEntityManager()->clear();
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

        $paths = array($this->app->getAppRootDir() . "/src/");
        $isDevMode = $this->dev_mode;
        $config = Setup::createAnnotationMetadataConfiguration($paths, $isDevMode, null, null, false);

        $config->setProxyDir($this->app->getAppRootDir() . '/cache/Doctrine/Proxies');

        if ($isDevMode) {
            $cache = new \Doctrine\Common\Cache\ArrayCache;
            $config->setAutoGenerateProxyClasses(true);
        } else {
            $cache = new \Doctrine\Common\Cache\ApcuCache;
            $config->setAutoGenerateProxyClasses(false);
        }

        $config->setMetadataCacheImpl($cache);
        $config->setQueryCacheImpl($cache);

        $conn = DriverManager::getConnection(Array(
            'driver' => $this->database_configuration["driver"],
            'host' => $this->database_configuration["host"],
            'port' => $this->database_configuration["port"],
            'dbname' => $this->database_configuration["dbname"],
            'user' => $this->database_configuration["user"],
            'password' => $this->database_configuration["password"],
            'ssl' => $this->database_configuration["ssl"],
            'twake_types' => Array(
                'twake_float' => 'Twake\Core\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'FloatType',
                'twake_datetime' => 'Twake\Core\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'DateTimeType',
                'twake_uuid' => 'Twake\Core\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'UUIDType',
                'twake_timeuuid' => 'Twake\Core\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'TimeUUIDType',
                'twake_boolean' => 'Twake\Core\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'BooleanType',
                'tinyint' => 'Twake\Core\Services\DoctrineAdapter\DBAL\Types\\TinyintType',
                'twake_no_salt_text' => 'Twake\Core\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'SearchableTextType',
                'twake_text' => 'Twake\Core\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'TextType',
                'twake_string' => 'Twake\Core\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'StringType',
                'twake_bigint' => 'Twake\Core\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'BigIntType',
                'twake_counter' => 'Twake\Core\Services\DoctrineAdapter\DBAL\Types\\' . $driver_type . 'CounterType'
            )
        ), $config);

        $encryptedStringType = Type::getType('twake_text');
        $encryptedStringType->setEncryptionKey(pack("H*", $this->database_configuration["encryption_key"]));

        $searchableEncryptedStringType = Type::getType('twake_no_salt_text');
        $searchableEncryptedStringType->setEncryptionKey(pack("H*", $this->database_configuration["encryption_key"]));

        $entityManager = EntityManager::create($conn, $config);

        $this->manager = $entityManager;

        /** @var CassandraConnection */
        $cassandraConnection = $this->manager->getConnection()->getWrappedConnection();
        $cassandraConnection->setApp($this->app);

        return $this->manager;
    }

    /** !Caution! : thin ttl will be used on the first insert in the next flush ! */
    public function useTTLOnFirstInsert($ttl)
    {
        $this->getManager()->getConnection()->getWrappedConnection()->useTTLOnFirstInsert($ttl);
    }

    public function getManager()
    {
        return $this->getEntityManager();
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

    public function es_put($entity, $index, $server = "twake")
    {

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
            $id = $entity->getId() . "";
            if (method_exists($entity, "getIndexationArray")) {
                $data = $entity->getIndexationArray();
            }
            if (method_exists($entity, "getContentKeywords") && is_array($entity->getContentKeywords())) {
                $keywords = $entity->getContentKeywords();
                //partie sur la verification du format des mots clés
                $keywords_verif = Array();
                foreach ($keywords as $keyword_score) {
                    $keys = array_keys($keyword_score);
                    if (count($keys) != 2 || $keys[0] != "keyword" || $keys[1] != "score" ||
                        gettype($keyword_score["keyword"]) != "string" || gettype($keyword_score["keyword"]) != "string") {
                        error_log("Wrong format for keyword data");
                    } else {
                        $keywords_verif[] = $keyword_score;
                    }
                }

                $name = $entity->getName();
                $keywords = $this->update_ES_keyword($keywords_verif, $name);
                $data["keywords"] = $keywords;

            }
        }

        $st = new StringCleaner();
        $data = $st->simplifyInArray($data);
        $route = "http://" . $this->es_server . "/" . $index . "/_doc/" . $id;


        try {
            $this->circle->put($route, json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 1, CURLOPT_TIMEOUT => 1, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));
        } catch (\Exception $e) {
            error_log("Unable to put on ElasticSearch.");
        }

    }

    public function update_ES_keyword($keywords, $word)
    {


        $keywords[] = Array(
            "keyword" => $word,
            "score" => 1.1
        );
        return $keywords;
    }

    public function remove($object)
    {
        if (!$object) {
            return;
        }
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


    /* Elastic Search */

    //update for important keywords from title or extension of a file only in ES to not repeat info in scyllaDB

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
            if (method_exists($object, "getLock()")) {
                if ($object->getLock() == true) {
                    $this->es_updates[$object->getId() . ""] = $object;
                    unset($this->es_removes[$object->getId() . ""]);
                    $object->setEsIndexed(true);
                }
            } else {
                if (!$object->getEsIndexed() || $object->changesInIndexationArray()) {
                    $this->es_updates[$object->getId() . ""] = $object;
                    unset($this->es_removes[$object->getId() . ""]);
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

    public function createQueryBuilder($qb = null)
    {
        return $this->getEntityManager()->createQueryBuilder($qb);
    }

    function validateDate($date, $format = 'Y-m-d')
    {
        $d = DateTime::createFromFormat($format, $date);
        // The Y ( 4 digits year ) returns TRUE for any integer with any number of digits so changing the comparison from == to === fixes the issue.
        return $d && $d->format($format) === $date;
    }

    public function es_search($options = Array(), $index = null, $server = "twake")
    {

        if (isset($options["scroll_id"])) {
            $route = "http://" . $this->es_server . "/_search/scroll";
            $res = $this->circle->post($route, json_encode(Array("scroll" => "5m", "scroll_id" => $options["scroll_id"])), array(CURLOPT_CONNECTTIMEOUT => 1, CURLOPT_TIMEOUT => 1, CURLOPT_HTTPHEADER => ['Content-Type: application/json']));
        } else {
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
                        if ($match && $result) {
                            $entities[] = [$result, 0];
                        }
                    }

                    return Array("result" => $entities);
                }
                return ["result" => []];
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

        if (!$res) {
            return ["result" => []];
        }

        $res = $res->getContent();

        $result = ["result" => []];
        $scroll_id = "";

        if ($res) {
            $res = json_decode($res, 1);
            if ($res["hits"]["total"] > $options["size"] && isset($res["_scroll_id"])) {
                //on a plus de 10 resultat et un ID il faut paginer
                $scroll_id = $res["_scroll_id"];
            }

            $result = [];
            if (isset($res["hits"]) && isset($res["hits"]["hits"])) {
                $res = $res["hits"]["hits"];

                foreach ($res as $object_json) {
                    if ($repository) {
                        $obj = $repository->findOneBy(Array("id" => $object_json["_id"]));
                    } else {
                        $obj = $object_json["_id"];
                    }

                    if ($obj) {
                        $result[] = Array($obj, isset($object_json["sort"]) ? $object_json["sort"] : 0);
                    }
                }
            }
            $result = Array("repository" => $repository, "scroll_id" => $scroll_id, "result" => $result);

        }
        return $result;

    }

    private function registerEntity($name)
    {
        $name = explode(":", $name);
        $entity_bundle_name_space = $name[0];
        $real_name_space = $entity_bundle_name_space . "\\Entity";
        $this->getEntityManager()->getConfiguration()->addEntityNamespace($entity_bundle_name_space, $real_name_space);
    }

    public function getRepository($name)
    {

        $this->registerEntity($name);

        try {
            $metadata = $this->getEntityManager()->getClassMetadata($name);
        } catch (\Exception $e) {
            error_log($e);
            return;
        }

        $em = $this->getEntityManager();
        return new RepositoryAdapter($em, $metadata);
    }


}
