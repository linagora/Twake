<?php

namespace DevelopersApiV1\Calendar;

require_once __DIR__ . "/Resources/Routing.php";

use Twake\Users\Resources\Routing;
use Twake\Users\Resources\Services;
use Common\BaseBundle;

class Bundle extends BaseBundle
{

    protected $bundle_root = __DIR__;
    protected $bundle_namespace = __NAMESPACE__;
    protected $routes = [];
    protected $services = [];

    public function initRoutes()
    {
        $routing = new Routing();
        $this->routes = $routing->getRoutes();
        $this->routing_prefix = $routing->getRoutesPrefix();
        parent::initRoutes();
    }
}