<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL;

use Doctrine\Common\EventManager;
use Doctrine\DBAL\Configuration;
use Doctrine\DBAL\DBALException;
use Doctrine\DBAL\Types\Type;

final class DriverManager
{
    static $instance = null;
    private static $_driverMap = array(
        'pdo_cassandra' => 'Twake\Core\Services\DoctrineAdapter\DBAL\Driver\PDOCassandra\Driver',
    );

    public static function getConnection(
        array $params,
        Configuration $config = null,
        EventManager $eventManager = null)
    {
        // create default config and event manager, if not set
        if (!$config) {
            $config = new Configuration();
        }
        if (!$eventManager) {
            $eventManager = new EventManager();
        }

        $params = self::parseDatabaseUrl($params);

        // check for existing pdo object
        if (isset($params['pdo']) && !$params['pdo'] instanceof \PDO) {
            throw DBALException::invalidPdoInstance();
        } else if (isset($params['pdo'])) {
            $params['pdo']->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            $params['driver'] = 'pdo_' . $params['pdo']->getAttribute(\PDO::ATTR_DRIVER_NAME);
        } else {
            self::_checkParams($params);
        }
        if (isset($params['driverClass'])) {
            $className = $params['driverClass'];
        } else {
            $className = self::$_driverMap[$params['driver']];
        }

        $driver = new $className();

        $wrapperClass = 'Doctrine\DBAL\Connection';
        if (isset($params['wrapperClass'])) {
            if (is_subclass_of($params['wrapperClass'], $wrapperClass)) {
                $wrapperClass = $params['wrapperClass'];
            } else {
                throw DBALException::invalidWrapperClass($params['wrapperClass']);
            }
        }
        if (self::$instance === null) {
            self::$instance = 1;
            //add new types
            foreach ($params["twake_types"] as $name => $class) {
                Type::addType($name, $class);
            }
        }

        return new $wrapperClass($params, $driver, $config, $eventManager);
    }

    private static function parseDatabaseUrl(array $params)
    {
        if (!isset($params['url'])) {
            return $params;
        }

        // (pdo_)?sqlite3?:///... => (pdo_)?sqlite3?://localhost/... or else the URL will be invalid
        $url = preg_replace('#^((?:pdo_)?sqlite3?):/' . '/' . '/#', '$1:/' . '/localhost/', $params['url']);

        $url = parse_url($url);

        if ($url === false) {
            throw new DBALException('Malformed parameter "url".');
        }

        if (isset($url['scheme'])) {
            $params['driver'] = str_replace('-', '_', $url['scheme']); // URL schemes must not contain underscores, but dashes are ok
        }

        if (isset($url['host'])) {
            $params['host'] = $url['host'];
        }
        if (isset($url['port'])) {
            $params['port'] = $url['port'];
        }
        if (isset($url['user'])) {
            $params['user'] = $url['user'];
        }
        if (isset($url['pass'])) {
            $params['password'] = $url['pass'];
        }

        if (isset($url['path'])) {
            if (!isset($url['scheme']) || (strpos($url['scheme'], 'sqlite') !== false && $url['path'] == ':memory:')) {
                $params['dbname'] = $url['path']; // if the URL was just "sqlite::memory:", which parses to scheme and path only
            } else {
                $params['dbname'] = substr($url['path'], 1); // strip the leading slash from the URL
            }
        }

        if (isset($url['query'])) {
            $query = array();
            parse_str($url['query'], $query); // simply ingest query as extra params, e.g. charset or sslmode
            $params = array_merge($params, $query); // parse_str wipes existing array elements
        }

        return $params;
    }

    private static function _checkParams(array $params)
    {
        // check existence of mandatory parameters

        // driver
        if (!isset($params['driver']) && !isset($params['driverClass'])) {
            throw DBALException::driverRequired();
        }

        // check validity of parameters

        // driver
        if (isset($params['driver']) && !isset(self::$_driverMap[$params['driver']])) {
            throw DBALException::unknownDriver($params['driver'], array_keys(self::$_driverMap));
        }

        if (isset($params['driverClass']) && !in_array('Doctrine\DBAL\Driver', class_implements($params['driverClass'], true))) {
            throw DBALException::invalidDriverClass($params['driverClass']);
        }
    }

    public static function getAvailableDrivers()
    {
        return array_keys(self::$_driverMap);
    }
}
