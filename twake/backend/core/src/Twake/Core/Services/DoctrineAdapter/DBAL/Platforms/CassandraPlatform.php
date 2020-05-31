<?php

namespace Twake\Core\Services\DoctrineAdapter\DBAL\Platforms;

use Doctrine\DBAL\DBALException;
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Schema\ForeignKeyConstraint;

class CassandraPlatform extends AbstractPlatform
{

    public function supportsLimitOffset()
    {
        return false;
    }

    public function getCountExpression($column)
    {
        return 'COUNT(*)';
    }

    public function getMaxExpression($column)
    {
        throw DBALException::notSupported(__METHOD__);
    }

    public function getMinExpression($column)
    {
        throw DBALException::notSupported(__METHOD__);
    }

    public function getAvgExpression($column)
    {
        throw DBALException::notSupported(__METHOD__);
    }

    public function getGuidExpression()
    {
        return 'uuid()';
    }

    public function getCurrentDateSQL()
    {
        return 'dateof(now())';
    }

    public function getCurrentTimeSQL()
    {
        return 'dateof(now())';
    }

    public function getCurrentTimestampSQL()
    {
        return 'unixTimestampOf(now())';
    }

    public function getClobTypeDeclarationSQL(array $field)
    {
        return 'varchar';
    }

    public function getDateTimeTypeDeclarationSQL(array $fieldDeclaration)
    {
        return 'timestamp';
    }

    public function getDateTimeFormatStringToDatabase()
    {
        return 'Y-m-d H:i:sO';
    }

    public function getBooleanTypeDeclarationSQL(array $field)
    {
        return 'boolean';
    }

    public function getBlobTypeDeclarationSQL(array $field)
    {
        return 'blob';
    }

    public function getFloatDeclarationSQL(array $fieldDeclaration)
    {
        return 'float';
    }

    public function getGuidTypeDeclarationSQL(array $field)
    {
        return 'uuid';
    }

    public function getDecimalTypeDeclarationSQL(array $columnDef)
    {
        return 'decimal';
    }

    public function getListTableColumnsSQL($table, $database = null)
    {
        return 'DESCRIBE TABLE ' . $table;
    }

    public function getCreateDatabaseSQL($name)
    {
        return "CREATE KEYSPACE IF NOT EXISTS $name WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 3 }";
    }

    public function getDropDatabaseSQL($name)
    {
        return 'DROP KEYSPACE ' . $name;
    }

    public function getDropIndexSQL($index, $table = null)
    {
        return 'DROP INDEX IF EXISTS ' . $index;
    }

    public function getIntegerTypeDeclarationSQL(array $field)
    {
        return 'int' . $this->_getCommonIntegerTypeDeclarationSQL($field);
    }

    protected function _getCommonIntegerTypeDeclarationSQL(array $columnDef)
    {
        return '';
    }

    public function getBigIntTypeDeclarationSQL(array $field)
    {
        return 'bigint' . $this->_getCommonIntegerTypeDeclarationSQL($field);
    }

    public function getSmallIntTypeDeclarationSQL(array $field)
    {
        return 'int' . $this->_getCommonIntegerTypeDeclarationSQL($field);
    }

    public function getAdvancedForeignKeyOptionsSQL(ForeignKeyConstraint $foreignKey)
    {
        return '';
    }

    public function getName()
    {
        return 'cassandra';
    }

    public function getReadLockSQL()
    {
        return '';
    }

    public function supportsTransactions()
    {
        return false;
    }

    public function getColumnDeclarationSQL($name, array $field)
    {
        if (isset($field['columnDefinition'])) {
            $columnDef = $this->getCustomTypeDeclarationSQL($field);
        } else {
            $default = $this->getDefaultValueDeclarationSQL($field);
            $check = (isset($field['check']) && $field['check']) ?
                ' ' . $field['check'] : '';

            /** @var \Doctrine\DBAL\Types\Type $type */
            $type = $field['type'];
            $typeDecl = $type->getSqlDeclaration($field, $this);
            $columnDef = $typeDecl;
        }

        return $name . ' ' . $columnDef;
    }

    public function getVarcharMaxLength()
    {
        return 65535;
    }

    protected function doModifyLimitQuery($query, $limit, $offset)
    {
        if ($limit !== null) {
            $query .= ' LIMIT ' . $limit;
        }
        return $query;
    }

    protected function getVarcharTypeDeclarationSQLSnippet($length, $fixed)
    {
        return 'varchar';
    }

    protected function getReservedKeywordsClass()
    {
        return 'Twake\Core\Services\DoctrineAdapter\DBAL\Platforms\Keywords\CassandraKeywords';
    }

    protected function _getCreateTableSQL($tableName, array $columns, array $options = array())
    {
        $queryFields = $this->getColumnDeclarationListSQL($columns);

        // attach all primary keys
        if (isset($options['primary']) && !empty($options['primary'])) {
            $keyColumns = array_unique(array_values($options['primary']));
            $queryFields .= ', PRIMARY KEY(' . implode(', ', $keyColumns) . ')';
        }

        $query = 'CREATE TABLE ' . $tableName . ' (' . $queryFields . ') ';
        $sql[] = $query;
        return $sql;
    }

    /**
     * http://doctrine-orm.readthedocs.org/en/latest/reference/basic-mapping.html
     */
    protected function initializeDoctrineTypeMappings()
    {
        $this->doctrineTypeMapping = array(
            'ascii' => 'string',
            'bigint' => 'bigint',
            'blob' => 'blob',
            'boolean' => 'boolean',
            'counter' => 'bigint',
            'decimal' => 'decimal',
            'double' => 'twake_float',
            'float' => 'twake_float',
            'inet' => 'string',
            'int' => 'integer',
            'list' => 'object',
            'map' => 'string',
            'set' => 'string',
            'text' => 'string',
            'timestamp' => 'twake_datetime',
            'timeuuid' => 'guid',
            'tuple' => 'object',
            'uuid' => 'guid',
            'varchar' => 'string',
            'varint' => 'bigint'
        );
    }

}
