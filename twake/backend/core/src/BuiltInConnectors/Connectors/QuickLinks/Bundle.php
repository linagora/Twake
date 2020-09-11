<?php

namespace BuiltInConnectors\Connectors\QuickLinks;

require_once __DIR__ . "/Resources/Routing.php";
require_once __DIR__ . "/Resources/Services.php";
require_once __DIR__ . "/ConnectorDefinition.php";

use BuiltInConnectors\Connectors\QuickLinks\ConnectorDefinition;
use BuiltInConnectors\Connectors\QuickLinks\Resources\Routing;
use BuiltInConnectors\Connectors\QuickLinks\Resources\Services;
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
        $this->routing_prefix = "bundle/connectors/" . $this->getDefinition()["simple_name"] . $routing->getRoutesPrefix();
        $this->initRoutes();

        $this->services = (new Services())->getServices();
        $this->initServices();

    }

    public function getDefinition(){
      $definition = (new ConnectorDefinition($this->app));
      $definition->setDefinition();
      return $definition->definition;
    }

    public function getConfiguration(){
      $definition = (new ConnectorDefinition($this->app));
      $definition->setConfiguration();
      return $definition->configuration;
    }

}
