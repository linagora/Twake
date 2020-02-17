<?php

namespace Twake\Core\Services\DoctrineAdapter\DBAL\Platforms;

use Doctrine\DBAL\DBALException;
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Schema\ForeignKeyConstraint;

/**
 * The CassandraPlatform provides the behavior, features and CQL dialect of the
 * Cassandra platform.
 *
 * @author Thang Tran <thang.tran@pyramid-consulting.com>
 */
class CassandraPlatform extends AbstractPlatform
{
    /**
     * {@inheritDoc}
     */
    public function supportsLimitOffset()
    {
        return false;
    }

    /**
     * {@inheritDoc}
     */
    public function getCountExpression($column)
    {
        return 'COUNT(*)';
    }

    /**
     * {@inheritDoc}
     */
    public function getMaxExpression($column)
    {
        throw DBALException::notSupported(__METHOD__);
    }

    /**
     * {@inheritDoc}
     */
    public function getMinExpression($column)
    {
        throw DBALException::notSupported(__METHOD__);
    }

    /**
     * {@inheritDoc}
     */
    public function getAvgExpression($column)
    {
        throw DBALException::notSupported(__METHOD__);
    }

    /**
     * {@inheritDoc}
     */
    public function getGuidExpression()
    {
        return 'uuid()';
    }

    /**
     * {@inheritDoc}
     */
    public function getCurrentDateSQL()
    {
        return 'dateof(now())';
    }

    /**
     * {@inheritDoc}
     */
    public function getCurrentTimeSQL()
    {
        return 'dateof(now())';
    }

    /**
     * {@inheritDoc}
     */
    public function getCurrentTimestampSQL()
    {
        return 'unixTimestampOf(now())';
    }

    /**
     * @param array $field
     *
     * @return string
     */
    public function getClobTypeDeclarationSQL(array $field)
    {
        return 'varchar';
    }

    /**
     * {@inheritDoc}
     */
    public function getDateTimeTypeDeclarationSQL(array $fieldDeclaration)
    {
        return 'timestamp';
    }

    public function getDateTimeFormatStringToDatabase()
    {
        return 'Y-m-d H:i:sO';
    }

    /**
     * {@inheritDoc}
     */
    public function getBooleanTypeDeclarationSQL(array $field)
    {
        return 'boolean';
    }

    /**
     * {@inheritDoc}
     */
    public function getBlobTypeDeclarationSQL(array $field)
    {
        return 'blob';
    }

    /**
     * {@inheritDoc}
     */
    public function getFloatDeclarationSQL(array $fieldDeclaration)
    {
        return 'float';
    }

    /**
     * {@inheritDoc}
     */
    public function getGuidTypeDeclarationSQL(array $field)
    {
        return 'uuid';
    }

    /**
     * {@inheritDoc}
     */
    public function getDecimalTypeDeclarationSQL(array $columnDef)
    {
        return 'decimal';
    }

    /**
     * {@inheritDoc}
     */
    public function getListTableColumnsSQL($table, $database = null)
    {
        return 'DESCRIBE TABLE ' . $table;
    }

    /**
     * {@inheritDoc}
     */
    public function getCreateDatabaseSQL($name)
    {
        return "CREATE KEYSPACE IF NOT EXISTS $name WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 3 }";
    }

    /**
     * {@inheritDoc}
     */
    public function getDropDatabaseSQL($name)
    {
        return 'DROP KEYSPACE ' . $name;
    }

    /**
     * {@inheritDoc}
     */
    public function getDropIndexSQL($index, $table = null)
    {
        return 'DROP INDEX IF EXISTS ' . $index;
    }

    /**
     * {@inheritDoc}
     */
    public function getIntegerTypeDeclarationSQL(array $field)
    {
        return 'int' . $this->_getCommonIntegerTypeDeclarationSQL($field);
    }

    /**
     * {@inheritDoc}
     */
    protected function _getCommonIntegerTypeDeclarationSQL(array $columnDef)
    {
        return '';
    }

    /**
     * {@inheritDoc}
     */
    public function getBigIntTypeDeclarationSQL(array $field)
    {
        return 'bigint' . $this->_getCommonIntegerTypeDeclarationSQL($field);
    }

    /**
     * {@inheritDoc}
     */
    public function getSmallIntTypeDeclarationSQL(array $field)
    {
        return 'int' . $this->_getCommonIntegerTypeDeclarationSQL($field);
    }

    /**
     * {@inheritDoc}
     */
    public function getAdvancedForeignKeyOptionsSQL(ForeignKeyConstraint $foreignKey)
    {
        return '';
    }

    /**
     * {@inheritDoc}
     */
    public function getName()
    {
        return 'cassandra';
    }

    /**
     * {@inheritDoc}
     */
    public function getReadLockSQL()
    {
        return '';
    }

    /**
     * {@inheritDoc}
     */
    public function supportsTransactions()
    {
        return false;
    }

    /**
     * {@inheritDoc}
     */
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

    /**
     * {@inheritDoc}
     */
    public function getVarcharMaxLength()
    {
        return 65535;
    }

    /**
     * Adds Cassandra-specific LIMIT clause to the query
     * No support for offset. Pagination must be implemented in-app
     * Restrict record limit to 1000 if not specified (Cassandra's default limit is 1000)
     *
     * @param string $query
     * @param int|null $limit
     * @param int|null $offset
     * @return string
     */
    protected function doModifyLimitQuery($query, $limit, $offset)
    {
        if ($limit !== null) {
            $query .= ' LIMIT ' . $limit;
        }
        return $query;
    }

    /**
     * {@inheritDoc}
     */
    protected function getVarcharTypeDeclarationSQLSnippet($length, $fixed)
    {
        return 'varchar';
    }

    /**
     * {@inheritDoc}
     */
    protected function getReservedKeywordsClass()
    {
        return 'Twake\Core\Services\DoctrineAdapter\DBAL\Platforms\Keywords\CassandraKeywords';
    }

    /**
     * {@inheritDoc}
     */
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
     * {@inheritDoc}
     * ref. http://doctrine-orm.readthedocs.org/en/latest/reference/basic-mapping.html
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
