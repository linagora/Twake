<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Platforms\AbstractPlatform;

require_once __DIR__ . "/TwakeTextType.php";

class MysqlSearchableTextType extends TwakeTextType
{
    protected $searchable = true;
}
