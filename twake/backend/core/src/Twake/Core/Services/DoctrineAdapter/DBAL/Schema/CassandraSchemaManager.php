<?php

namespace Twake\Core\Services\DoctrineAdapter\DBAL\Schema;

use Doctrine\DBAL\Schema\AbstractSchemaManager;
use Doctrine\DBAL\Schema\Column;
use Twake\Core\Services\DoctrineAdapter\DBAL\Types\Type as Type;

class CassandraSchemaManager extends AbstractSchemaManager
{
    protected function _getPortableTableColumnDefinition($tableColumn)
    {
        $tableColumn = array_change_key_case($tableColumn, CASE_LOWER);

        $dbType = strtolower($tableColumn['type']);
        $dbType = strtok($dbType, '(), ');
        $fixed = null;

        if (!isset($tableColumn['name'])) {
            $tableColumn['name'] = '';
        }
        $type = $this->_platform->getDoctrineTypeMapping($dbType);
        $options = array();
        return new Column($tableColumn['field'], Type::getType($type), $options);
    }
}
