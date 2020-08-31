<?php
namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Types\Type;
use Doctrine\DBAL\Platforms\AbstractPlatform;
 
 
class TinyintType extends Type
{
    const TINYINT = 'tinyint';
 
 
    public function getSQLDeclaration(array $fieldDeclaration, AbstractPlatform $platform)
    {
        return 'TINYINT';
    }
 
 
    public function convertToPHPValue($value, AbstractPlatform $platform)
    {
        return intval($value);
    }
 
 
    public function convertToDatabaseValue($value, AbstractPlatform $platform)
    {
        return $value;
    }
 
 
    public function getName()
    {
        return self::TINYINT;
    }
}