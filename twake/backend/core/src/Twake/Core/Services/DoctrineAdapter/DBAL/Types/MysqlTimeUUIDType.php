<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\ConversionException;
use InvalidArgumentException;
use Ramsey\Uuid\Doctrine\UuidBinaryOrderedTimeType;
use Ramsey\Uuid\UuidInterface;

class MysqlTimeUUIDType extends UuidBinaryOrderedTimeType
{

    const NAME = 'uuid_binary_ordered_time';

    public function getSQLDeclaration(array $fieldDeclaration, AbstractPlatform $platform)
    {
        return $platform->getVarcharTypeDeclarationSQL(
            array(
                'length' => '42'
            )
        );
    }

    public function convertToPHPValue($value, AbstractPlatform $platform)
    {
        if (empty($value)) {
            return null;
        }

        if ($value instanceof UuidInterface) {
            return $value;
        }

        try {
            return parent::convertToPHPValue(hex2bin(str_replace("-", "", $value)), $platform);
        } catch (InvalidArgumentException $e) {
            throw ConversionException::conversionFailed($value, self::NAME);
        }
    }

    public function convertToDatabaseValue($value, AbstractPlatform $platform)
    {
        if (empty($value)) {
            return null;
        }

        try {
            if (is_string($value) || method_exists($value, '__toString') || $value instanceof UuidInterface) {
                $value = bin2hex(parent::convertToDatabaseValue($value, $platform));
                if(!preg_match("/[^a-f0-9-]/", $value)){
                    return $value;
                }else{
                    return null;
                }
            }
        } catch (InvalidArgumentException $e) {
            // Ignore the exception and pass through.
        }

        throw ConversionException::conversionFailed($value, self::NAME);
    }

}



