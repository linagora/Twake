<?php

namespace DevelopersApiV1\Drive\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/v1/drive/";

    protected $routes = [
#Calendar routing
        "remove" => ["handler" => "Drive:remove", "methods" => ["POST"]],
        "save" => ["handler" => "Drive:save", "methods" => ["POST"]],
        "list" => ["handler" => "Drive:getList", "methods" => ["POST"]],
        "find" => ["handler" => "Drive:find", "methods" => ["POST"]],
        "download" => ["handler" => "Drive:download", "methods" => ["POST"]],
    ];

}