<?php

namespace Twake\Market\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/market/";

    protected $routes = [
# Apps management

        "app/search" => ["handler" => "Application:search", "methods" => ["POST"]],
        "app/find" => ["handler" => "Application:find", "methods" => ["POST"]],
# Apps API

        "app/api/event" => ["handler" => "ApplicationApi:event", "methods" => ["POST"]],
        "app/api/getToken" => ["handler" => "ApplicationApi:getToken", "methods" => ["POST"]],
# Apps Developers

        "app/create" => ["handler" => "ApplicationDevelopment:create", "methods" => ["POST"]],
        "app/remove" => ["handler" => "ApplicationDevelopment:remove", "methods" => ["POST"]],
        "app/update" => ["handler" => "ApplicationDevelopment:update", "methods" => ["POST"]],
        "app/get_developed" => ["handler" => "ApplicationDevelopment:getGroupDevelopedApps", "methods" => ["POST"]],
    ];

}