<?php

namespace DevelopersApiV1\Calendar;

require_once __DIR__ . "/Resources/Routing.php";

use DevelopersApiV1\Calendar\Resources\Routing;
use DevelopersApiV1\Calendar\Resources\Services;
use Common\BaseBundle;

class Bundle extends BaseBundle
{

    protected $bundle_root = __DIR__;
    protected $bundle_namespace = __NAMESPACE__;
    protected $routes = [];
    protected $services = [];

    public function init()
    {
        $routing = new Routing();
        $this->routes = $routing->getRoutes();
        $this->routing_prefix = $routing->getRoutesPrefix();
        $this->initRoutes();
    }
}