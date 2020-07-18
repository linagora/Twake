<?php

namespace Common;

use App\App;

class Providers extends \Pimple\Container
{

    /** @var App */
    private $app = null;

    /** @var \Configuration\Providers */
    private $configuration = null;

    private $services = [];

    private $registered_services = [];

    private $service_instances = [];

    public $providers_options = [];

    public function __construct(App $app, \Configuration\Providers $configuration)
    {
        $this->app = $app;
        $this->configuration = $configuration;

        foreach ($configuration->providers as $name => $provider_config) {

            //Each provider expose multiple services
            foreach ($provider_config["services"] as $service) {
                $this->services[$service] = $provider_config;
            }

        }

        $this->provider_config = new \Pimple\Container();

    }

    public function get($key)
    {

        if (isset($this->service_instances[$key])) {
            return $this->service_instances[$key];
        }

        if (!isset($this->services[$key])) {
            error_log($key . " service was not found");
            return null;
        }

        $service_register_name = $this->services[$key]["register"];
        if (empty($this->registered_services[$service_register_name])) {

            if (isset($services[$key]["parameters"])) {
                $parameters_key = $services[$key]["parameters"];
                $parameters = $this->app->getContainer()->get("parameters", $parameters_key);
                foreach ($parameters as $key => $parameter) {
                    $this->providers_options[$key] = $parameter;
                }
            }

            if (isset($services[$key]["configuration"])) {
                $parameters_key = $services[$key]["configuration"];
                $parameters = $this->app->getContainer()->get("configuration", $parameters_key);
                foreach ($parameters as $key => $parameter) {
                    $this->providers_options[$key] = $parameter;
                }
            }

            $service = new $service_register_name();
            $service->register($this->provider_config);
            $this->registered_services[$service_register_name] = $service;

        }

        try {
            $this->service_instances[$key] = $this->provider_config[$key];
        } catch (\Exception $e) {
            error_log($e);
        }

        return $this->service_instances[$key];

    }

    public function getContainer()
    {
        return $this->provider_config;
    }


}
