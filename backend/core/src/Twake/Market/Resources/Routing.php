<?php

namespace Twake\Market\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/market/";

    protected $routes = [
# Apps management

        "app/search" => ["handler" => "Application:search", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "app/find" => ["handler" => "Application:find", "methods" => ["POST"], "security" => ["user_connected_security"]],
# Apps API

        "app/api/event" => ["handler" => "ApplicationApi:event", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "app/api/getToken" => ["handler" => "ApplicationApi:getToken", "methods" => ["POST"], "security" => ["user_connected_security"]],
# Apps Developers

        "app/create" => ["handler" => "ApplicationDevelopment:create", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "app/remove" => ["handler" => "ApplicationDevelopment:remove", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "app/update" => ["handler" => "ApplicationDevelopment:update", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "app/get_developed" => ["handler" => "ApplicationDevelopment:getGroupDevelopedApps", "methods" => ["POST"], "security" => ["user_connected_security"]],
    ];

}