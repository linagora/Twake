<?php

namespace DevelopersApiV1\Users\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/users/";

    protected $routes = [
#Message routing
        "get" => ["handler" => "Users:getAction", "methods" => ["POST"]],
    ];

}