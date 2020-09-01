<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Types\StringType;

class CassandraStringType extends StringType
{

    public function getBindingType()
    {
        return "twake_string";
    }

}
