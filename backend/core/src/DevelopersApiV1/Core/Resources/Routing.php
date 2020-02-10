<?php

namespace DevelopersApiV1\Core\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/users/";

    protected $routes = [
        "token" => ["handler" => "Default:getInfoFromToken", "methods" => ["POST"]],

    ];

}