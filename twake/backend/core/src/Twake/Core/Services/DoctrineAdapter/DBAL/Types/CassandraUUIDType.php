<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\StringType;
use Twake\Core\Services\DoctrineAdapter\DBAL\Types\CassandraTimeUUIDType;

class CassandraUUIDType extends CassandraTimeUUIDType
{

    /**
     * It's best to let PDO driver guess the binding type rather than forcing to string
     */
    public function getBindingType()
    {
        return "twake_uuid";
    }

    public function convertToPHPValue($value, AbstractPlatform $platform)
    {
        $value = parent::convertToPHPValue($value, $platform) . "";
        $value[14] = "4";
        return $value;
    }

    public function convertToDatabaseValue($value, AbstractPlatform $platform)
    {
        $value = parent::convertToDatabaseValue($value, $platform) . "";
        $value[14] = "1";
        return $value;
    }

}
