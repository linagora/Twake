<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\ConversionException;
use Doctrine\DBAL\Types\DateTimeType;

/**
 * Type that maps an SQL DATETIME/TIMESTAMP to a PHP DateTime object.
 *
 * @since 2.0
 */
class CassandraDateTimeType extends DateTimeType
{

    public function convertToPHPValue($value, AbstractPlatform $platform)
    {
        if ($value === null || $value instanceof \DateTime) {
            return $value;
        }

        $val = \DateTime::createFromFormat($platform->getDateTimeFormatString(), $value);
        if (!$val) {
            $value = $this->getDateStringFromHex($value);
            $val = \DateTime::createFromFormat($platform->getDateTimeFormatString(), $value);
        }
        if (!$val) {
            throw ConversionException::conversionFailedFormat($value, $this->getName(), $platform->getDateTimeFormatString());
        }

        return $val;
    }

    /**
     * @param $str
     * @return bool|string
     */
    public function getDateStringFromHex($str)
    {
        if (is_numeric("" . $str)) {
            $time = intval("" . $str) / 1000;
            return date('Y-m-d H:i:s', $time);
        } else {
            $date = unpack('H*', $str);
            $time = hexdec($date[1]) / 1000;
            return date('Y-m-d H:i:s', $time);
        }
    }

    public function convertToDatabaseValue($value, AbstractPlatform $platform)
    {

        if ($value === null || is_string($value)) {
            return $value;
        }

        $val = null;

        if ($value instanceof \DateTime) {
            $val = $value->format($platform->getDateTimeFormatStringToDatabase());
        }

        if (!$val) {
            throw ConversionException::conversionFailedFormat(
                $value,
                $this->getName(),
                $platform->getDateTimeFormatStringToDatabase()
            );
        }

        return $val;
    }


}
