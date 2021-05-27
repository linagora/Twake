<?php

namespace Twake\Notifications\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/notifications/";

    protected $routes = [
        #Collections
        //"get" => ["handler" => "Base:getAction", "methods" => ["POST"], "security" => ["user_connected_security"]],
        //"remove" => ["handler" => "Base:remove", "methods" => ["POST"], "security" => ["user_connected_security"]],
        //"deleteAll" => ["handler" => "Base:deleteAllExceptMessages", "methods" => ["POST"], "security" => ["user_connected_security"]],
        //"readAll" => ["handler" => "Base:readAll", "methods" => ["POST"], "security" => ["user_connected_security"]],
    ];

}