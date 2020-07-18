<?php

namespace Common;

use App\App;

class Container
{

    /** @var App */
    private $app = null;

    private $configuration = [];

    public function __construct(App $app)
    {
        $this->app = $app;
    }

    public function import(Configuration $configuration, $name)
    {
        $this->configuration[$name] = $configuration->configuration;
    }

    public function getParameter($key)
    {
        return $this->get("parameters", $key);
    }

    public function hasParameter($key)
    {
        return !!$this->get("parameters", $key);
    }

    public function get($namespace, $key)
    {
        $key = explode(".", $key);
        $obj = $this->configuration[$namespace];
        $i = 0;
        while (is_array($obj) && $i < count($key)) {
            $obj = @$obj[$key[$i]];

            if (is_object($obj) && is_subclass_of($obj, "Common\Configuration") && isset($obj->configuration)) {
                $obj = $obj->configuration;
            }

            $i++;
        }
        return $obj;
    }

}
