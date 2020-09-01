<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\BigIntType;

class CassandraCounterType extends BigIntType
{

    /**
     * It's best to let PDO driver guess the binding type rather than forcing to string
     */
    public function getBindingType()
    {
        return "twake_counter";
    }

    public function getSQLDeclaration(array $fieldDeclaration, AbstractPlatform $platform)
    {
        return "COUNTER";
    }

}
