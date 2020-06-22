<?php

namespace DevelopersApiV1\Users\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/v1/users/";

    protected $routes = [
        #Message routing
        "get" => ["handler" => "Users:getAction", "methods" => ["POST"]],
        "notifications" => ["handler" => "Users:getNotifications", "methods" => ["POST"]],
    ];

}
