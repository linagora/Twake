<?php

namespace Twake\Core\Services\DoctrineAdapter;

class FakeCassandraTimeuuid
{
    public function __construct($timeuuid = "00000000-0000-1000-0000-000000000000")
    {
        $this->timeuuid = $timeuuid;
    }

    public function __toString()
    {
        return $this->timeuuid;
    }

    public function isNull()
    {
        return $this->timeuuid == "00000000-0000-1000-0000-000000000000";
    }
}