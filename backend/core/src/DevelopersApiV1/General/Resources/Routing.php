<?php

namespace DevelopersApiV1\General\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/v1/general/";

    protected $routes = [
        "configure" => ["handler" => "General:configure", "methods" => ["POST"]],
        "configure_close" => ["handler" => "General:closeConfigure", "methods" => ["POST"]],
    ];

}