<?php

namespace App;

require_once __DIR__ . "/Common/BaseController.php";
require_once __DIR__ . "/Common/BaseBundles.php";
require_once __DIR__ . "/Common/BaseBundle.php";
require_once __DIR__ . "/Common/BaseRouting.php";
require_once __DIR__ . "/Common/BaseServices.php";
require_once __DIR__ . "/Common/Routing.php";
require_once __DIR__ . "/Common/Container.php";
require_once __DIR__ . "/Common/Services.php";
require_once __DIR__ . "/Common/Configuration.php";
require_once __DIR__ . "/Common/Providers.php";

require_once __DIR__ . "/Configuration/Bundles.php";
require_once __DIR__ . "/Configuration/Configuration.php";
require_once __DIR__ . "/Configuration/Parameters.php";
require_once __DIR__ . "/Configuration/Providers.php";

use Common\Routing;
use Common\Container;
use Common\Services;
use Common\Providers;
use Configuration\Bundles;
use Configuration\Configuration;
use Configuration\Parameters;
use Pecee\SimpleRouter\SimpleRouter;
use Twake\Core\Services\DoctrineAdapter\CassandraSessionHandler;

class App
{

    private $app_root_dir = "";

    /** @var Routing */
    private $routing_service = null;

    /** @var Container */
    private $container_service = null;

    /** @var Services */
    private $services_service = null;

    /** @var Providers */
    private $providers_service = null;

    public function __construct()
    {

        $bundles = (new Bundles())->getBundles();
        $bundles_instances = [];

        $this->app_root_dir = realpath(__DIR__ . "/../");
        $this->routing_service = new Routing($this);
        $this->container_service = new Container($this);
        $this->services_service = new Services($this);
        $this->providers_service = new Providers($this, new \Configuration\Providers());

        // Import configuration
        $this->container_service->import(new Configuration($this), "configuration");
        $this->container_service->import(new Parameters($this), "parameters");

        // Require and instanciate all defined bundles
        foreach ($bundles as $bundle) {

            if (file_exists(__DIR__ . "/../src/" . $bundle . "/Bundle.php")) {
                require_once __DIR__ . "/../src/" . $bundle . "/Bundle.php";
                $class_name = str_replace("/", "\\", $bundle) . "\\Bundle";
                $bundles_instances[] = new $class_name($this);
            } else {
                error_log("No such bundle " . $bundle);
            }

        }

        // Init routing for all bundles
        foreach ($bundles_instances as $bundle_instance) {
            $bundle_instance->init();
        }


    }

    public function getRouting()
    {
        return $this->routing_service;
    }

    public function getContainer()
    {
        return $this->container_service;
    }

    public function getServices()
    {
        return $this->services_service;
    }

    public function getProviders()
    {
        return $this->providers_service;
    }

    public function getAppRootDir()
    {
        return $this->app_root_dir;
    }

    public function run()
    {
        SimpleRouter::start();
    }
}