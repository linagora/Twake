<?php

namespace Common;


abstract class BaseRouting
{

    protected $routing_prefix = "";
    protected $routes = [];

    public function getRoutes()
    {
        return $this->routes;
    }

    public function getRoutesPrefix()
    {
        return $this->routing_prefix;
    }

}