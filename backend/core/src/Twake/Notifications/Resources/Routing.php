<?php

namespace Twake\Notifications\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/notifications/";

    protected $routes = [
#Collections
        "get" => ["handler" => "Base:getAction", "methods" => ["POST"]],
        "remove" => ["handler" => "Base:remove", "methods" => ["POST"]],
        "deleteAll" => ["handler" => "Base:deleteAllExceptMessages", "methods" => ["POST"]],
        "readAll" => ["handler" => "Base:readAll", "methods" => ["POST"]],
    ];

}