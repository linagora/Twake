<?php

namespace Common;

use App\App;

class Providers
{

    /** @var App */
    private $app = null;

    /** @var \Configuration\Providers */
    private $configuration = null;

    private $services = [];

    private $silex_registered_services = [];

    private $service_instances = [];

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

    }

    public function get($key)
    {
        if (isset($this->service_instances[$key])) {
            return $this->service_instances[$key];
        }

        $service_register_name = $this->services[$key]["register"];
        if (!$this->silex_registered_services[$service_register_name]) {

            $options = [];

            if (isset($services[$key]["parameters"])) {
                $parameters_key = $services[$key]["parameters"];
                $parameters = $this->app->getContainer()->get("parameters", $parameters_key);
                foreach ($parameters as $key => $parameter) {
                    $this->app->getSilexApp()[$key] = $parameter;
                }
                $options = array_merge($options, $parameters);
            }

            if (isset($services[$key]["configuration"])) {
                $parameters_key = $services[$key]["configuration"];
                $parameters = $this->app->getContainer()->get("configuration", $parameters_key);
                foreach ($parameters as $key => $parameter) {
                    $this->app->getSilexApp()[$key] = $parameter;
                }
                $options = array_merge($options, $parameters);
            }

            $this->app->getSilexApp()->register(new $service_register_name(), $options);
            $this->silex_registered_services[$service_register_name] = true;


        }

        $this->service_instances[$key] = $this->app->getSilexApp()[$key];

        return $this->service_instances[$key];

    }


}
