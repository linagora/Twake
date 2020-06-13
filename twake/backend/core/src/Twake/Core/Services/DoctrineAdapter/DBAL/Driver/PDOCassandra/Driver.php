<?php

namespace Twake\Core\Services\DoctrineAdapter\DBAL\Driver\PDOCassandra;

use Twake\Core\Services\DoctrineAdapter\DBAL\Platforms\CassandraPlatform;
use Twake\Core\Services\DoctrineAdapter\DBAL\Schema\CassandraSchemaManager;

/**
 * PDO Cassandra driver.
 */
class Driver implements \Doctrine\DBAL\Driver
{

    public function connect(array $params, $username = null, $password = null, array $driverOptions = array())
    {
        $driverOptions = array_merge($driverOptions, $params);

        $driverOptions[\PDO::ATTR_ERRMODE] = \PDO::ERRMODE_EXCEPTION;
        $conn = new CassandraConnection(
            $params['dbname'],
            $username,
            $password,
            $driverOptions
        );
        $this->cassandra_connection = $conn;
        return $conn;
    }

    public function getConnection()
    {
        return $this->cassandra_connection;
    }

    public function getDatabasePlatform()
    {
        return new CassandraPlatform();
    }

    public function getSchemaManager(\Doctrine\DBAL\Connection $conn)
    {
        return new CassandraSchemaManager($conn);
    }

    public function getName()
    {
        return 'pdo_cassandra';
    }

    public function getDatabase(\Doctrine\DBAL\Connection $conn)
    {
        $params = $conn->getParams();

        if (isset($params['dbname'])) {
            return $params['dbname'];
        }
        return null;
    }

    private function _constructPdoDsn(array $params)
    {
        $dsn = 'cassandra:';
        $arrHosts = array();
        $arrPorts = array();
        if (isset($params['host']) && $params['host'] != '') {
            $arrHosts = explode(',', $params['host']);
        }
        if (isset($params['port'])) {
            $arrPorts = explode(',', $params['port']);
        }
        for ($i = 0; $i < count($arrHosts); $i++) {
            $dsn .= 'host=' . $arrHosts[$i] . ';';
            $dsn .= 'port=' . $arrPorts[$i];
            $dsn .= ($i == count($arrHosts) - 1) ? ';' : ',';
        }
        if (isset($params['cqlversion'])) {
            $dsn .= 'cqlversion=' . $params['cqlversion'] . ';';
        }
        return $dsn;
    }
}
