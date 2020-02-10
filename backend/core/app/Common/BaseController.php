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
    public function get($key)
    {
        return $this->app->getServices()->get($key);
    }

    public function getUser()
    {

        $request = $this->app->getSilexApp()["request_stack"]->getCurrentRequest();
        $user = $this->app->getServices()->get("app.session_handler")->getUser($request);

        return $user;
    }

    public function getParameter($key)
    {
        return $this->app->getContainer()->getParameter($key);
    }

}