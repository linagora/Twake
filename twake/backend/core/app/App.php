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
require_once __DIR__ . "/Common/CommandsManager.php";
require_once __DIR__ . "/Common/Counter.php";

require_once __DIR__ . "/Configuration/Bundles.php";
require_once __DIR__ . "/Configuration/Configuration.php";
require_once __DIR__ . "/Configuration/Parameters.php";
require_once __DIR__ . "/Configuration/Providers.php";
require_once __DIR__ . "/Configuration/Commands.php";

use Common\CommandsManager;
use Common\Counter;
use Common\Routing;
use Common\Container;
use Common\Services;
use Common\Providers;
use Configuration\Bundles;
use Configuration\Commands;
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

    /** @var Counter */
    private $counter = null;

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

        $dsn = $this->getContainer()->getParameter("env.sentry");
        if($dsn){
                \Sentry\init(['dsn' => $dsn, 'error_types' => (E_ERROR | E_WARNING | E_PARSE)]);
        }

        $segment = $this->getContainer()->getParameter("env.segment");
        $GLOBALS["segment_enabled"] = false;
        if($segment){
            $GLOBALS["segment_enabled"] = true;
            \Segment::init($segment);
        }

        $this->counter = new Counter($this);

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

    public function getCommands()
    {
        return $this->commands;
    }

    public function getCounter()
    {
        return $this->counter;
    }

    public function runCli()
    {
        if (php_sapi_name() == "cli") {
            $this->commands = new CommandsManager($this, (new Commands())->commands);
            ($this->commands)->run();
        }
    }

    public function run()
    {
      try{
        SimpleRouter::start();
      }catch(\Exception $err){
        error_log($err);
        http_response_code(500);
        echo '{"error": "'.$err->getMessage().'"}';
      }
    }
}
