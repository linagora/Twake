<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Types\DateTimeType;

/**
 * Type that maps an SQL DATETIME/TIMESTAMP to a PHP DateTime object.
 *
 * @since 2.0
 */
class MysqlDateTimeType extends DateTimeType
{


}
