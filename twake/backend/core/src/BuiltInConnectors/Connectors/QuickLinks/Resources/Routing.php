<?php

namespace BuiltInConnectors\Connectors\QuickLinks\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{
  protected $routing_prefix = "/";

  protected $routes = [
    "read" => ["handler" => "Index:read", "methods" => ["POST"]],
    "save" => ["handler" => "Index:save", "methods" => ["POST"]],
    "remove" => ["handler" => "Index:remove", "methods" => ["POST"]],
    "icon" => ["handler" => "Index:icon", "methods" => ["GET"]],
    "event" => ["handler" => "Index:event", "methods" => ["POST"]],
    "app" => ["handler" => "Index:app", "methods" => ["GET"]],
  ];
}
