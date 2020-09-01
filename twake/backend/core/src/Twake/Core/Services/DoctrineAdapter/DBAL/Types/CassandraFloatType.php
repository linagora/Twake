<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Types\FloatType;

class CassandraFloatType extends FloatType
{
    /**
     * It's best to let PDO driver guess the binding type rather than forcing to string
     */
    public function getBindingType()
    {
        return \PDO::PARAM_NULL;
    }
}
