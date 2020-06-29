<?php

namespace Common;

use App\App;

class Services
{

    /** @var App */
    private $app = null;

    private $services = [];
    private $services_instances = [];

    public function __construct(App $app)
    {
        $this->app = $app;
    }

    public function set($key, $class_src_path, $class_name)
    {
        if (isset($this->services[$key])) {
            error_log("The service " . $key . " is already defined.");
            return;
        }
        $this->services[$key] = [
            "src_path" => $class_src_path,
            "name" => $class_name
        ];
    }

    /** Lasy instanciate service */
    public function get($key)
    {

        if (!isset($this->services[$key])) {
            error_log("The requested service " . $key . " is not defined.");
            return null;
        }

        if (isset($this->services_instances[$key])) {
            return $this->services_instances[$key];
        }

        require_once $this->services[$key]["src_path"];
        $name = $this->services[$key]["name"];
        $this->services_instances[$key] = new $name($this->app);

        return $this->services_instances[$key];
    }

    public function isLoaded($key)
    {
        return isset($this->services[$key]);
    }

}
