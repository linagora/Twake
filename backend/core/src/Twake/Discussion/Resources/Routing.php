<?php

namespace Twake\Discussion\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/discussion/";

    protected $routes = [
        "get" => ["handler" => "Discussion:getAction", "methods" => ["POST"]],
        "save" => ["handler" => "Discussion:save", "methods" => ["POST"]],
        "remove" => ["handler" => "Discussion:remove", "methods" => ["POST"]]
    ];

}