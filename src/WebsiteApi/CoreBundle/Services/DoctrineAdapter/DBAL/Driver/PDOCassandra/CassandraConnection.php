<?php

namespace WebsiteApi\CoreBundle\Services\DoctrineAdapter\DBAL\Driver\PDOCassandra;

use Doctrine\DBAL\Driver\PDOConnection;
use Cassandra;

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
        error_log($mode);
    }

    private function stripslashesCell($obj = "")
    {
        if (is_string($obj)) {
            $obj = stripslashes($obj);
        }
        return $obj;
    }

    private function stripslashesRow($obj = Array())
    {
        if (!is_array($obj)) {
            return $obj;
        }
        foreach ($obj as $key => $value) {
            $obj[$key] = $this->stripslashesCell($value);
        }
        return $obj;
    }

    public function fetchColumn($position)
    {
        $res = $this->data->current();
        $this->data->next();
        $res = $res[array_keys($res)[$position]];
        return $this->stripslashesCell($res);
    }

    public function fetch()
    {
        if (!$this->data) {
            return null;
        }
        $res = $this->data->current();
        $this->data->next();
        return $this->stripslashesRow($res);
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
        $this->values[$parameter] = $value;
    }

    public function execute($parameters = Array())
    {
        $query = $this->query;
        ksort($this->values);
        foreach ($this->values as $position => $value) {

            if ($value == NULL) {
                $value = "NULL";
            } else
                if (is_string($value)) {
                    $value = addslashes($value);
                    $value = "'" . $value . "'";
                }

            $from = '/' . preg_quote("?", '/') . '/';
            $query = preg_replace($from, $value, $query, 1);
        }

        $this->executor->exec($query, $this);

    }

    public function closeCursor()
    {

    }

}

/**
 * @author Thang Tran <thang.tran@pyramid-consulting.com>
 */
class CassandraConnection
{

    public function __construct($keyspace, $username, $password, $driverOptions)
    {
        $this->cluster = Cassandra::cluster()
            ->withContactPoints("scylladb")
            ->build();
        $this->session = $this->cluster->connect(strtolower($keyspace));
        $this->keyspace = $keyspace;
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

    /**
     * {@inheritdoc}
     */
    public function commit()
    {
        return true;
    }

    /**
     * {@inheritdoc}non-PHPdoc)
     */
    public function rollBack()
    {
        return true;
    }

    /**
     * {@inheritdoc}non-PHPdoc)
     */
    function prepare($prepareString)
    {
        $prepareString = $this->removeTableAlias($prepareString);
        $prepareString_cql = $this->normalizeCount($prepareString);
        $prepareString = new PDOStatementAdapter();
        $prepareString->setQuery($prepareString_cql, $this);
        return $prepareString;
    }

    /**
     * {@inheritdoc}non-PHPdoc)
     */
    public function query($cql = null, $pdoStatement = null)
    {
        $sql = $this->removeTableAlias($cql);
        $sql = $this->normalizeCount($sql);
        $sql = $this->removeCQLUnallowedKeys($sql);

        if ($sql == "SELECT uuid()") {
            $sql = "select now() from system.local";
        }

        $future = $this->session->executeAsync($sql);
        if (!$pdoStatement) {
            $pdo = new PDOStatementAdapter();
        } else {
            $pdo = $pdoStatement;
        }
        $pdo->setData($future->get());
        return $pdo;
    }

    public function exec($cql, $pdoStatement = null)
    {
        return $this->query($cql, $pdoStatement);
    }

    /**
     * For COUNT(), Cassandra only allows two formats: COUNT(1) and COUNT(*)
     * @param string $sql
     * @return string $sql
     */
    private function normalizeCount($sql)
    {
        $sql = trim(preg_replace('/COUNT\(.*\)/i', 'COUNT(1)', $sql));
        return $sql;
    }

    /**
     * Cassandra does not support table alias. Let's remove them
     * @param string $sql
     * @return string $sql
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

    private function removeCQLUnallowedKeys($sql)
    {

        $keys = Array(
            "token",
            "from",
            "to"
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

        error_log($sql);

        return $sql;
    }
}
