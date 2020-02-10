<?php

namespace AdministrationApi\Core;

require_once __DIR__ . "/Resources/Services.php";

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
        $this->services = (new Services())->getServices();
        parent::initServices();
    }
}