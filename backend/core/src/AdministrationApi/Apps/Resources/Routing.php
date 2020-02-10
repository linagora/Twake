<?php

namespace AdministrationApi\Apps\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/backend/apps/";

    protected $routes = [
        "getApps" => ["handler" => "Apps:getAllApps", "methods" => ["POST"]],
        "getOneApp" => ["handler" => "Apps:getOneApp", "methods" => ["POST"]],
        "toggleValidation" => ["handler" => "Apps:toggleValidation", "methods" => ["POST"]],
    ];

}