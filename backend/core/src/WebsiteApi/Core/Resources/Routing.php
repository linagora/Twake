<?php

namespace WebsiteApi\Core\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routes = [
        "version" => ["handler" => "Version:getVersion", "methods" => ["GET"]]
    ];

}