<?php

namespace Twake\Channels\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/channels/";

    protected $routes = [
        "get" => ["handler" => "Channels:getAction", "methods" => ["POST"], "security" => ["user_connected_security"]],
    ];

}