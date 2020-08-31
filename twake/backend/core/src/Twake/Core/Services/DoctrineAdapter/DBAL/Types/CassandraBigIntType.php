<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Types\BigIntType;

class CassandraBigIntType extends BigIntType
{

    public function getBindingType()
    {
        return "twake_bigint";
    }

}
