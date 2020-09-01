<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Platforms\AbstractPlatform;

require_once __DIR__ . "/TwakeTextType.php";

class MysqlTextType extends TwakeTextType
{
    protected $searchable = false;
}
