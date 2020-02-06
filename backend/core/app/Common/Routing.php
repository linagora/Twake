<?php

namespace Common;

use App\App;
use Symfony\Component\HttpFoundation\Request;

class Routing
{

    /** @var App */
    private $app = null;

    private $silex_app = null;

    public function __construct(App $app, $silex_app)
    {
        $this->app = $app;
        $this->silex_app = $silex_app;
    }

    public function get($route, $callback)
    {
        $this->silex_app->get($route, function () use ($callback) {
            return $callback();
        });
    }

    public function post($route, $callback)
    {
        $this->silex_app->post($route, function (Request $request) use ($callback) {
            return $callback($request);
        });
    }

}
