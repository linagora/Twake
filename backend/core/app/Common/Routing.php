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
            return $this->beforeRender($callback());
        });
    }

    public function post($route, $callback)
    {
        $this->silex_app->post($route, function (Request $request) use ($callback) {
            return $this->beforeRender($callback($request));
        });
    }

    //Allow any origin and set cookies in json response
    private function beforeRender($response)
    {
        if (isset($_SERVER['HTTP_ORIGIN']) && strpos("http://localhost", $_SERVER['HTTP_ORIGIN']) == 0) {
            $response->headers->set('Access-Control-Allow-Origin', $_SERVER['HTTP_ORIGIN']);
        }
        $response->headers->set('Access-Control-Allow-Headers', ' Content-Type, *');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST');
        $response->headers->set('Access-Control-Max-Age', '600');
        $length = strlen($response->getContent());
        $response->headers->set('x-decompressed-content-length', $length);

        @$content = json_decode($response->getContent(), 1);

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
            $response->setContent(json_encode($content));
        }
        return $response;
    }

}
