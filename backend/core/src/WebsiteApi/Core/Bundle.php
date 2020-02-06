<?php

namespace WebsiteApi\Core;

require_once __DIR__ . "/Resources/Routing.php";
require_once __DIR__ . "/Resources/Services.php";

use WebsiteApi\Core\Resources\Routing;
use WebsiteApi\Core\Resources\Services;
use Common\BaseBundle;

class Bundle extends BaseBundle
{

    protected $routing_prefix = "api/core/";

    protected $bundle_root = __DIR__;
    protected $bundle_namespace = __NAMESPACE__;
    protected $routes = [];
    protected $services = [];

    public function initRoutes()
    {
        $this->routes = (new Routing())->getRoutes();
        parent::initRoutes();

        $this->services = (new Services())->getServices();
        parent::initServices();
    }
}