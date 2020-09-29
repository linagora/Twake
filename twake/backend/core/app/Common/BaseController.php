<?php

namespace Common;

use App\App;
use Common\Http\Response;

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

        $request = $this->app->getRouting()->getCurrentRequest();
        $user = $this->app->getServices()->get("app.session_handler")->getUser($request);

        return $user ?: "anonymous"; //null is reserved to user == system
    }

    public function getParameter($key, $fallback = null)
    {
        return $this->app->getContainer()->getParameter($key) ?: $fallback;
    }

    public function redirect($url)
    {
        $response = new Response("");
        $this->app->getServices()->get("app.session_handler")->setCookiesInResponse($response);
        $response->setHeader("Location: " . $url, true);
        $response->sendHeaders();
        exit();
    }

}
