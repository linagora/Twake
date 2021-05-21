<?php

namespace Twake\Discussion\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/discussion/";

    protected $routes = [
        "get" => ["handler" => "Discussion:getAction", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "save" => ["handler" => "Discussion:save", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "remove" => ["handler" => "Discussion:remove", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "noderealtime" => ["handler" => "Discussion:nodeRealTime", "methods" => ["POST"]]
    ];

}