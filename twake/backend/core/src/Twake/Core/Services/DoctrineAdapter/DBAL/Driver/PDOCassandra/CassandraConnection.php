<?php

namespace Twake\Core\Services\DoctrineAdapter\DBAL\Driver\PDOCassandra;

use App\App;
use Cassandra;
use Dompdf\Exception;

class FakeCassandraRows extends PDOStatementAdapter
{
    public function __construct($list)
    {
        $this->list = $list;
        $this->pointer = 0;
    }

    public function next()
    {
        $this->pointer++;
    }

    public function rewind()
    {
        $this->pointer = 0;
    }

    public function current()
    {
        if (!$this->list || !isset($this->list[$this->pointer])) {
            return null;
        }
        return $this->list[$this->pointer];
    }

    public function count()
    {
        return count($this->list);
    }

    public function isLastPage()
    {
        return true;
    }

}

class PDOStatementAdapter
{

    public function __construct()
    {
        $this->values = Array();
        $this->data = null;
    }

    public function setQuery($query, $executor)
    {
        $this->executor = $executor;
        $this->query = $query;
    }

    public function setData($data)
    {
        $this->data = $data;
    }

    public function setFetchMode($mode)
    {
    }

    public function fetchColumn($position)
    {
        $res = $this->data->current();
        $this->data->next();
        $res = $res[array_keys($res)[$position]];
        return $this->stripslashesCell($res);
    }

    protected function stripslashesCell($obj = "")
    {
        if (is_string($obj)) {
            $obj = stripslashes($obj);
        }
        return $obj;
    }

    public function fetchAll($fetch_style, $fetch_argument = null, $ctor_args = array())
    {
        $res = Array();

        while ($row) {
            $row = $this->fetch();
            if ($row) {
                $res[] = $row;
            }
        }

        return $res;
    }

    public function fetch()
    {
        if (!$this->data) {
            return null;
        }
        $res = $this->data->current();
        $this->data->next();

        if (!$this->data->current() && !$this->data->isLastPage()) {
            $this->data = $this->data->nextPage();
        }

        return $this->stripslashesRow($res);
    }

    protected function stripslashesRow($obj = Array())
    {
        if (!is_array($obj)) {
            return $obj;
        }
        foreach ($obj as $key => $value) {
            $obj[$key] = $this->stripslashesCell($value);
        }
        return $obj;
    }

    public function rowCount()
    {
        if (!$this->data) {
            return 0;
        }
        $res = $this->data->count();
        return $res;
    }

    public function bindValue($parameter, $value, $type)
    {
        $this->types[$parameter] = $type;
        $this->values[$parameter] = $value;
    }

    public function execute($parameters = Array())
    {
        $query = $this->query;

        //lowercase columns
        $query = preg_replace_callback('/ ([a-zA-Z0-9_]+ +)AS /', function ($match) {
            return ' ' . strtolower($match[1]) . ' AS ';
        }, $query);
        $query = preg_replace_callback('/ ([a-zA-Z0-9_]+ +)([^a-zA-Z0-9_]{1,2}) *\?/', function ($match) {
            return ' ' . strtolower($match[1]) . ' ' . $match[2] . ' ?';
        }, $query);

        $query_explode = explode("?", $query);
        $query = "";

        $there_is_a_counter = false;

        foreach ($query_explode as $position => $query_part) {

            if ($position == count($query_explode) - 1) {

                $query .= $query_explode[count($query_explode) - 1];

            } else {

                $value = $this->values[$position + 1];

                if ($this->types[$position + 1] == "twake_boolean") {
                    $value = (!$value) ? "0" : "1"; //Cassandra booleans are tiny ints
                } else if ($this->types[$position + 1] == "twake_bigint") {
                    $value = intval($value);
                } else if ($this->types[$position + 1] == "twake_counter") {
                    $there_is_a_counter = $position;
                    preg_match("/([a-z_]+) *= *$/", $query_part, $matches);
                    if (isset($matches[1])) {
                        $column_name = $matches[1];
                        if ($value > 0) {
                            $value = $column_name . " + " . $value;
                        } else {
                            $value = $column_name . " - " . $value;
                        }
                    } else {
                        $value = $value;
                    }
                } else if ($value == NULL && !is_string($value)) {
                    $value = "NULL";
                } else if ($this->types[$position + 1] == \PDO::PARAM_INT || $this->types[$position + 1] == "twake_timeuuid" || $this->types[$position + 1] == "twake_uuid" || $this->types[$position + 1] == "twake_bigint") {
                    if ($value . "" != "" && preg_replace("/[0-9]/", "", $value) == "") {
                        $value = $value;
                    } else if (preg_match('/^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/', $value)) {
                        $value = $value;
                    } else {
                        $value = "00000000-0000-1000-0000-000000000000";
                    }
                } else if (is_string($value) || (is_object($value) && method_exists($value, 'toCqlString')) || $this->types[$position + 1] == "twake_string") {
                    $value = addslashes($value);
                    $value = str_replace("'", "''", $value);
                    $value = "'" . $value . "'";
                }

                $query .= $query_part . "" . $value;

            }
        }

        $query = preg_replace("/ +IS +NULL( |$)/", " = NULL ", $query);


        if ($there_is_a_counter !== false && preg_match("/^INSERT/", $query)) {

            //Change INSERTS to UPDATES
            $pos = $there_is_a_counter;
            preg_match("/^ *INSERT +INTO +([a-z_]+) +\(([a-z_ ,]+)\) +values +\((.*)\) *$/", $query, $matches);
            $table = $matches[1];
            $parameters = explode(",", $matches[2]);
            $values = explode(",", $matches[3]);
            $increment_value = $values[$pos];
            if ($increment_value >= 0) {
                $increment_value = " + " . intval($increment_value);
            }
            $new_query = "UPDATE " . $table . " SET " . $parameters[$pos] . " = " . $parameters[$pos] . " " . $increment_value . " WHERE ";

            $first = true;
            foreach ($parameters as $k => $parameter) {
                if ($k != $pos) {
                    if (!$first) $new_query .= " AND ";
                    $new_query .= $parameter . " = " . $values[$k];
                    $first = false;
                }
            }

            $query = $new_query;

        }

        try {
            $this->executor->exec($query, $this);
        } catch (\Exception $e) {
            $message = "SCYLLADB > AN ERROR OCCURED WITH THIS QUERY : " . preg_replace("/AS .* FROM/", "AS [...] FROM", $query);
            error_log($message);
            error_log($e);
        }

    }

    public function closeCursor()
    {

    }

}

class CassandraConnection
{

    private $use_ttl = null;
    /** @var App */
    private $app = null;

    public function __construct($keyspace, $username, $password, $driverOptions)
    {

        $this->cluster = Cassandra::cluster()
            ->withContactPoints($driverOptions["host"]);

        if ($driverOptions["ssl"]) {
            $ssl = Cassandra::ssl()
                ->withTrustedCerts($driverOptions["ssl"]["node_certificate"])
                ->withVerifyFlags(Cassandra::VERIFY_PEER_CERT)
                ->build();
            $this->cluster = $this->cluster
                ->withSSL($ssl);
        }

        if ($driverOptions["port"]) {
            $this->cluster = $this->cluster
                ->withPort($driverOptions["port"]);
        }

        if ($driverOptions["user"]) {
            $this->cluster = $this->cluster
                ->withCredentials($driverOptions["user"], $driverOptions["password"]);
        }

        $this->cluster = $this->cluster
            ->build();

        try {
            $this->session = $this->cluster->connect(strtolower($keyspace));
        } catch (\Exception $e) {
            $this->session = $this->cluster->connect();

            error_log("Prepare keyspace creation");

            $statement = new Cassandra\SimpleStatement(
                "CREATE KEYSPACE IF NOT EXISTS " . strtolower($keyspace) . " WITH replication = " . ($driverOptions["replication"] ?: "{'class': 'SimpleStrategy', 'replication_factor': '1'}")
            );
            $future = $this->session->executeAsync($statement);
            $future->get();

            error_log("Did create keyspace");

            $this->session = $this->cluster->connect(strtolower($keyspace));
        }

        $this->keyspace = $keyspace;
        $this->view_to_use = null;
    }

    public function setApp(App $app)
    {
        $this->app = $app;
    }

    public function changeTableToView($view_to_use)
    {
        $this->view_to_use = $view_to_use;
    }

    public function useTTLOnFirstInsert($ttl)
    {
        $this->use_ttl = $ttl;
    }

    public function getSchema()
    {
        return $this->session->schema();
    }

    public function getKeyspace()
    {
        return $this->keyspace;
    }

    public function beginTransaction()
    {
        return true;
    }

    public function commit()
    {
        return true;
    }

    public function rollBack()
    {
        return true;
    }

    function prepare($prepareString)
    {
        $prepareString = $this->removeTableAlias($prepareString);
        $prepareString_cql = $this->normalizeCount($prepareString);
        $prepareString = new PDOStatementAdapter();
        $prepareString->setQuery($prepareString_cql, $this);
        return $prepareString;
    }

    /**
     * Cassandra does not support table alias. Let's remove them
     */
    private function removeTableAlias($sql)
    {
        //clean up extra space
        $sql = trim(preg_replace('/\s+/', ' ', $sql));
        $arrSplitByFROM = explode('FROM ', $sql, 2);
        if (count($arrSplitByFROM) >= 2) {
            $arrSplit4TableAlias = explode(' ', trim($arrSplitByFROM[1]), 3);
            if (count($arrSplit4TableAlias) >= 2
                && strtoupper($arrSplit4TableAlias[1]) != 'WHERE') {
                //replace table alias and merge stuff
                $alias = $arrSplit4TableAlias[1];
                $arrSplit4TableAlias[1] = '';
                $arrSplitByFROM[0] = str_replace($alias . '.', '', $arrSplitByFROM[0]);
                $arrSplitByFROM[1] = implode(' ', $arrSplit4TableAlias);
                $arrSplitByFROM[1] = str_replace($alias . '.', '', $arrSplitByFROM[1]);
                return implode('FROM ', $arrSplitByFROM);
            }

        }
        return $sql;
    }

    /**
     * For COUNT(), Cassandra only allows two formats: COUNT(1) and COUNT(*)
     */
    private function normalizeCount($sql)
    {
        $sql = trim(preg_replace('/COUNT\(.*\)/i', 'COUNT(1)', $sql));
        return $sql;
    }

    public function exec($cql, $pdoStatement = null)
    {
        return $this->query($cql, $pdoStatement);
    }

    /**
     * {@inheritdoc}non-PHPdoc)
     */
    public function query($cql = null, $pdoStatement = null)
    {
        if ($this->app) $this->app->getCounter()->startTimer("cql_time");


        $view_to_use = false;
        if ($this->view_to_use) {
            $view_to_use = $this->view_to_use . "_custom_index";
        }
        $this->view_to_use = null;

        if ($view_to_use) {
            $_cql = preg_replace("/ FROM [a-z_\-0-9]+ /", " FROM " . $view_to_use . " ", $cql);
            $_cql = preg_replace("/ *SELECT .* FROM /", "SELECT * FROM ", $_cql);

            $results = $this->query($_cql, $pdoStatement);
            $row = true;
            $ids = [];
            $list = [];
            while ($row) {
                $row = $results->fetch(\PDO::FETCH_ASSOC);
                if ($row && isset($row["id"])) {
                    $ids[] = $row["id"]->uuid();
                }
            }
            foreach ($ids as $id) {
                $__cql = preg_replace("/ WHERE .*$/", " WHERE id = " . $id, $cql);
                $result = $this->query($__cql, $pdoStatement)->fetch(\PDO::FETCH_ASSOC);
                $list[] = $result;
            }

            if (!$pdoStatement) {
                $pdo = new PDOStatementAdapter();
            } else {
                $pdo = $pdoStatement;
            }


            $pdo->setData(new FakeCassandraRows($list));
            if ($this->app) $this->app->getCounter()->stopTimer("cql_time");

            return $pdo;

        } else {

            $sql = $this->removeTableAlias($cql);
            $sql = $this->normalizeCount($sql);
            $sql = $this->removeCQLUnallowedKeys($sql);
            if ($this->use_ttl && $this->use_ttl > 0) {
                $sql = $this->addTTL($sql, $this->use_ttl);
            }
            $this->use_ttl = null;

            if ($sql == "SELECT uuid()") {
                $sql = "select now() from system.local";
            }

            if ($this->app) $this->app->getCounter()->incrementCounter("cql_requests");

            $future = $this->session->executeAsync($sql);
            if (!$pdoStatement) {
                $pdo = new PDOStatementAdapter();
            } else {
                $pdo = $pdoStatement;
            }


            $rows = $future->get();
            $pdo->setData($rows);

            if ($this->app) $this->app->getCounter()->stopTimer("cql_time");

            return $pdo;

        }
    }

    private function removeCQLUnallowedKeys($sql)
    {

        $keys = Array(
            "token",
            "from",
            "to",
            "default"
        );

        $sql = explode('FROM ', $sql, 2);
        if (isset($sql[1])) { //There is a FROM
            foreach ($keys as $key) {
                $sql[0] = preg_replace('/([^a-z_-])' . preg_quote($key, '/') . '([^a-z_-])/', '$1"' . $key . '"$2', $sql[0]);
            }
        }
        $sql = join("FROM ", $sql);

        $sql = explode(') VALUES ', $sql, 2);
        if (isset($sql[1])) { //There is a FROM
            foreach ($keys as $key) {
                $sql[0] = preg_replace('/([^a-z_-])' . preg_quote($key, '/') . '([^a-z_-])/', '$1"' . $key . '"$2', $sql[0]);
            }
        }
        $sql = join(") VALUES ", $sql);

        $sql = explode('WHERE ', $sql, 2);
        if (isset($sql[1])) { //There is a WHERE
            $sql[1] = " " . $sql[1];
            foreach ($keys as $key) {
                $sql[1] = preg_replace('/([^a-z_-])' . preg_quote($key, '/') . ' *=/', '$1"' . $key . '" =', $sql[1]);
            }
        }
        $sql = join("WHERE ", $sql);


        foreach ($keys as $key) {
            $sql = preg_replace('/\(' . preg_quote($key, '/') . '\)/', '("' . $key . '")', $sql);
        }


        return $sql;
    }

    private function addTTL($sql, $ttl)
    {
        if (!$ttl || intval($ttl) < 1) {
            return;
        }
        if (strpos($sql, "INSERT ") === 0) {
            $sql = preg_replace("/; *$/", "", $sql);
            $sql = $sql . " USING TTL  " . intval($ttl) . " ";
            $sql = $sql . ";";
        }
        return $sql;
    }


}
