<?php

namespace Common;

use App\App;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class Routing
{

    /** @var App */
    private $app = null;

    private $silex_app = null;

    public function __construct(App $app, $silex_app)
    {
        $this->app = $app;
        $this->silex_app = $silex_app;

        $silex_app->before(function (Request $request) {
            if (0 === strpos($request->headers->get('Content-Type'), 'application/json')) {
                $data = json_decode($request->getContent(), true);
                $request->request->replace(is_array($data) ? $data : array());
            }
        });
    }

    public function get($route, $callback)
    {
        $this->silex_app->get($route, function () use ($callback) {
            try {
                return $this->beforeRender($callback());
            } catch (\Exception $e) {
                error_log($e);
            }
        });
    }

    public function post($route, $callback)
    {
        $this->silex_app->post($route, function (Request $request) use ($callback) {
            try {
                return $this->beforeRender($callback($request));
            } catch (\Exception $e) {
                error_log($e);
            }
        });
    }

    //Allow any origin and set cookies in json response
    private function beforeRender(Response $response)
    {
        if (isset($_SERVER['HTTP_ORIGIN']) && strpos("http://localhost", $_SERVER['HTTP_ORIGIN']) == 0) {
            $response->headers->set('Access-Control-Allow-Origin', $_SERVER['HTTP_ORIGIN'], true);
        }
        $response->headers->set('Access-Control-Allow-Headers', ' Content-Type, *', true);
        $response->headers->set('Access-Control-Allow-Credentials', 'true', true);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST', true);
        $response->headers->set('Access-Control-Max-Age', '600', true);
        $length = strlen($response->getContent());
        $response->headers->set('x-decompressed-content-length', $length, true);

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

        $this->app->getServices()->get("app.session_handler")->setCookiesInResponse($response);

        return $response;
    }

}
