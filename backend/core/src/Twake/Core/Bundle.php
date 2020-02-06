<?php

namespace Twake\Core;

require_once __DIR__ . "/Resources/Routing.php";
require_once __DIR__ . "/Resources/Services.php";

require_once __DIR__ . "/Entity/FrontObject.php";
require_once __DIR__ . "/Entity/SearchableObject.php";

use Twake\Core\Resources\Routing;
use Twake\Core\Resources\Services;
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