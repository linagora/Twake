<?php

namespace Common;

use App\App;

/**
 * Controllers super class
 */
abstract class BaseController
{

    /** @var App */
    protected $app = null;

    /** @var Container */
    protected $container = null;

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->container = $app->getContainer();
    }

    /* Get service */
    protected function get($key)
    {
        return $this->app->getServices()->get($key);
    }

}