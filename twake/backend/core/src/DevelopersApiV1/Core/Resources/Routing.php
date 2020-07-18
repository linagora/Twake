<?php

namespace DevelopersApiV1\Core\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/v1/core/";

    protected $routes = [
        "token" => ["handler" => "Base:getInfoFromToken", "methods" => ["POST"]],
    ];

}