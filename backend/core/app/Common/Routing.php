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
    private $request = null;

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->request = new Request();
    }

    public function addRoute($method, $route, $callback)
    {
        if (isset($this->routes[$route . ":" . $method])) {
            error_log("Route " . $route . " was already defined.");
            return;
        }
        $this->routes[$route . ":" . $method] = true;

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
                $this->beforeRender($callback($this->request));
            } catch (\Exception $e) {
                error_log($e);
            }
        });
    }

    public function post($route, $callback)
    {
        SimpleRouter::post($route, function () use ($callback) {
            try {
                $this->beforeRender($callback($this->request));
            } catch (\Exception $e) {
                error_log($e);
            }
        });
    }

    //Allow any origin and set cookies in json response
    private function beforeRender(Response $response)
    {
        if (isset($_SERVER['HTTP_ORIGIN']) && strpos("http://localhost", $_SERVER['HTTP_ORIGIN']) == 0) {
            header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN'], true);
        }
        header('Access-Control-Allow-Headers: ' . 'Content-Type, *', true);
        header('Access-Control-Allow-Credentials: ' . 'true', true);
        header('Access-Control-Allow-Methods: ' . 'GET, POST', true);
        header('Access-Control-Max-Age: ' . '600', true);
        $length = strlen($response->getContent());
        header('x-decompressed-content-length: ' . $length, true);

        $content = $response->getContent();

        if (is_array($content)) {
            $cookies = [];
            foreach (headers_list() as $header) {
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

        $response->send();
    }

    public function getCurrentRequest()
    {
        return $this->request;
    }

}
