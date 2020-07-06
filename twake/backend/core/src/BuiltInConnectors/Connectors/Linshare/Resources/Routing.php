<?php

namespace BuiltInConnectors\Connectors\Linshare\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "/";

    protected $routes = [
      "icon" => ["handler" => "Index:icon", "methods" => ["GET"]],
      "event" => ["handler" => "Index:event", "methods" => ["POST"]],
      "download" => ["handler" => "Index:download", "methods" => ["GET"]],
    ];

}
