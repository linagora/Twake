<?php

namespace Twake\Notifications\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/users/";

    protected $routes = [
#Collections
        "get" => ["handler" => "Default:getAction", "methods" => ["POST"]],

        "remove" => ["handler" => "Default:remove", "methods" => ["POST"]],

        "deleteAll" => ["handler" => "Default:deleteAllExceptMessages", "methods" => ["POST"]],

        "readAll" => ["handler" => "Default:readAll", "methods" => ["POST"]],


    ];

}