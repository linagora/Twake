<?php

namespace BuiltInConnectors\Common;

require_once __DIR__ . "/Resources/Routing.php";
require_once __DIR__ . "/Resources/Services.php";

use BuiltInConnectors\Common\Resources\Routing;
use BuiltInConnectors\Common\Resources\Services;
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

        $this->services = (new Services())->getServices();
        $this->initServices();

        $path = __DIR__ . "/../Connectors/";
        $dir = new \DirectoryIterator($path);
        $connectors_bundles_instances = [];
        // Require and instanciate all defined connectors
        foreach ($dir as $fileinfo) {
            if ($fileinfo->isDir() && !$fileinfo->isDot()) {
              try{
                $bundle = "BuiltInConnectors/Connectors/" . $fileinfo->getFilename();
                if (file_exists(__DIR__ . "/../../" . $bundle . "/Bundle.php")) {
                    require_once __DIR__ . "/../../" . $bundle . "/Bundle.php";
                    $class_name = str_replace("/", "\\", $bundle) . "\\Bundle";
                    $connectors_bundles_instances[] = new $class_name($this->app);
                } else {
                    error_log("No such connector bundle " . $bundle);
                }
              }catch(\Exception $err){
                error_log("No such connector bundle " . $fileinfo->getFilename());
                error_log($err->getMessage());
              }
            }
        }

        // Init routing for all bundles
        foreach ($connectors_bundles_instances as $bundle_instance) {
            $bundle_instance->init();
        }

    }
}
