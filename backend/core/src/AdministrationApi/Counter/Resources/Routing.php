<?php

namespace AdministrationApi\Counter\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/backend/counter/";

    protected $routes = [
        "getCounter" => ["handler" => "Counter:getCounter", "methods" => ["POST"]],
    ];

}