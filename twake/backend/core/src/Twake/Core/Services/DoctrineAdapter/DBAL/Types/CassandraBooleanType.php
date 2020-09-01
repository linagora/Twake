<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\BooleanType;

class CassandraBooleanType extends BooleanType
{

    public function convertToPHPValue($value, AbstractPlatform $platform)
    {

        if (is_object($value) && method_exists($value, "value")) {
            $value = $value->value();
        }

        $res = false;
        try {
            $res = ((!$value) ? false : true);
        } catch (\Exception $e) {
        }

        return $res;
    }

    /**
     * It's best to let PDO driver guess the binding type rather than forcing to string
     */
    public function getBindingType()
    {
        return "twake_boolean";
    }
}
