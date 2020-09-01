<?php


namespace Twake\Core\Services\DoctrineAdapter\DBAL\Types;

use Doctrine\DBAL\Platforms\AbstractPlatform;

require_once __DIR__ . "/TwakeTextType.php";

class CassandraSearchableTextType extends TwakeTextType
{
    protected $searchable = true;

}
