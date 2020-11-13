<?php

namespace Common;

use App\App;
use Common\Http\Request;
use Common\Http\Response;
use Pecee\SimpleRouter\SimpleRouter;

class Routing
{

    /** @var App */
    private $app = null;
    private $routes = [];
    private $routesToController = [];
    private $request = null;

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->request = new Request();
    }

    public function addRoute($method, $route, $callback)
    {
        $route = preg_replace("/^\//", "", $route);
        $route = preg_replace("/\/$/", "", $route);

        if (isset($this->routes[$route . ":" . $method])) {
            error_log("Route " . $route . " was already defined.");
            return;
        }
        $this->routes[$route . ":" . $method] = true;
        $this->routesToController[$route . ":" . $method] = $callback;

        if ($method == "get") {
            $this->get($route, $callback);
        } else if ($method == "post") {
            $this->post($route, $callback);
        } else {
            error_log("Unable to register route " . $route . ": method " . $method . " is not implemented.");
        }
    }

    public function get($route, $callback)
    {
        SimpleRouter::get($route, function () use ($callback) {
            try {
                $response = $this->beforeRender($callback($this->request));
                $response->send();
            } catch (\Exception $e) {
                error_log($e);
            }
        });
    }

    public function post($route, $callback)
    {
        SimpleRouter::post($route, function () use ($callback) {
            try {
                $response = $this->beforeRender($callback($this->request));
                $response->send();
            } catch (\Exception $e) {
                error_log($e);
            }
        });
    }

    //Allow any origin and set cookies in json response
    private function beforeRender(Response $response)
    {

        if (isset($_SERVER['HTTP_ORIGIN']) && strpos("http://localhost", $_SERVER['HTTP_ORIGIN']) == 0) {
            $response->setHeader('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN'], true);
        }
        $response->setHeader('Access-Control-Allow-Headers: ' . 'All-Cookies, Authorization, Content-Type, *', true);
        $response->setHeader('Access-Control-Allow-Credentials: ' . 'true', true);
        $response->setHeader('Access-Control-Allow-Methods: ' . 'GET, POST', true);
        $response->setHeader('Access-Control-Max-Age: ' . '600', true);
        $length = strlen($response->getContent());
        $response->setHeader('x-decompressed-content-length: ' . $length, true);

        $content = $response->getContent();

        if (is_array($content)) {
            $cookies = [];
            foreach ($response->headers->all() as $header) {
                if (strpos("Set-Cookie: ", $header) == 0) {
                    $ex = explode("Set-Cookie: ", $header);
                    if (count($ex) == 2) {
                        $cookies[] = $ex[1];
                    }
                }
            }
            $content["_cookies"] = $cookies;
            $response->setContent($content);
        }

        $this->app->getServices()->get("app.session_handler")->setCookiesInResponse($response);

        return $response;
    }

    public function execute($method, $route, Request $request)
    {
        $this->request = $request;

        $route = preg_replace("/^\//", "", $route);
        $route = preg_replace("/\/$/", "", $route);

        if (isset($this->routesToController[$route . ":" . strtolower($method)])) {
            $response = $this->routesToController[$route . ":" . strtolower($method)]($request);
        } else {
            error_log(json_encode($route . ":" . strtolower($method)) . " does not exists.");
            $response = new Response();
        }
        return $this->beforeRender($response);
    }

    public function getRoutes()
    {
        return array_keys($this->routes);
    }

    public function getCurrentRequest()
    {
        return $this->request;
    }

}
