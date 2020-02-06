<?php

namespace Common;


abstract class BaseRouting
{

    protected $routes = [];

    public function getRoutes()
    {
        return $this->routes;
    }

}