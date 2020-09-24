<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\StringType;

class CassandraTimeUUIDType extends StringType
{

    /**
     * It's best to let PDO driver guess the binding type rather than forcing to string
     */
    public function getBindingType()
    {
        return "twake_timeuuid";
    }

    public function convertToPHPValue($value, AbstractPlatform $platform)
    {
        if (!$value) {
            return null;
        }
        $value = $value . "";
        if(!preg_match("/[^a-f0-9-]/", $value)){
            return $value;
        }else{
            return null;
        }
    }

}
