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
        } else if ($method == "put") {
            $this->put($route, $callback);
        } else if ($method == "delete") {
            $this->delete($route, $callback);
        } else {
            error_log("Unable to register route " . $route . ": method " . $method . " is not implemented.");
        }
    }

    public function get($route, $callback)
    {
        SimpleRouter::get($route, function () use ($callback) {
            error_log("[Router] - GET " . $_SERVER["REQUEST_URI"]);
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
            error_log("[Router] - POST " . $_SERVER["REQUEST_URI"]);
            try {
                $response = $this->beforeRender($callback($this->request));
                $response->send();
            } catch (\Exception $e) {
                error_log($e);
            }
        });
    }

    public function put($route, $callback)
    {
        SimpleRouter::put($route, function () use ($callback) {
            error_log("[Router] - PUT " . $_SERVER["REQUEST_URI"]);
            try {
                $response = $this->beforeRender($callback($this->request));
                $response->send();
            } catch (\Exception $e) {
                error_log($e);
            }
        });
    }

    public function delete($route, $callback)
    {
        SimpleRouter::delete($route, function () use ($callback) {
            error_log("[Router] - DELETE " . $_SERVER["REQUEST_URI"]);
            try {
                $response = $this->beforeRender($callback($this->request));
                $response->send();
            } catch (\Exception $e) {
                error_log($e);
            }
        });
    }

    //Allow any origin
    private function beforeRender(Response $response)
    {
        if (isset($_SERVER['HTTP_ORIGIN']) && strpos("http://localhost", $_SERVER['HTTP_ORIGIN']) == 0) {
            $response->setHeader('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN'], true);
        }
        $response->setHeader('Access-Control-Allow-Headers: ' . 'authorization, Content-Type, *', true);
        $response->setHeader('Access-Control-Allow-Credentials: ' . 'true', true);
        $response->setHeader('Access-Control-Allow-Methods: ' . 'GET, POST', true);
        $response->setHeader('Access-Control-Max-Age: ' . '600', true);
        $length = strlen($response->getContent());
        $response->setHeader('x-decompressed-content-length: ' . $length, true);

        $content = $response->getContent();

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
