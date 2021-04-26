<?php

namespace Common;

use App\App;

use Common\Http\Request;
use Common\Http\Response;


/**
 * Bundles root file super class
 */
abstract class BaseBundle
{

    /** @var App */
    protected $app = null;

    protected $routing_prefix = "";
    protected $bundle_root = "";
    protected $bundle_namespace = "";
    protected $routes = [];
    protected $services = [];

    public function __construct(App $app)
    {
        $this->app = $app;
    }

    public function init()
    {
    }

    /**
     * Load routes from Bundle php configuration
     */
    protected function initRoutes()
    {

        // For all defined route, create routing + connect lasy controller loader
        $routing_service = $this->app->getRouting();
        foreach ($this->routes as $route => $data) {

            $final_route = preg_replace("/\\/+/", "/", $this->routing_prefix . "/" . $route);
            $handler = null;
            $methods = ["POST"];

            if (is_string($data)) {
                $handler = $data;
            } else {
                $handler = $data["handler"];
                if (isset($data["methods"])) $methods = $data["methods"];
            }

            $security = [];
            if (isset($data["security"])) $security = $data["security"];

            $controller = explode(":", $handler);
            $handler = $controller[1];
            $controller = $controller[0];

            foreach ($methods as $method) {

                $method = strtolower($method);
                if (!in_array($method, ["get", "post", "delete", "put"])) {
                    continue;
                }

                $that = $this;
                $routing_service->addRoute($method, $final_route, function (Request $request = null) use ($that, $controller, $handler, $security) {

                    if (count($security) > 0) {
                        foreach ($security as $security_service) {
                            $service = $this->app->getServices()->get($security_service);
                            if ($service) {
                                $response = $service->applySecurity($request);
                                if ($response && $response !== true) {
                                    return $response;
                                }
                            } else {
                                error_log("Missing security service " . $service);
                            }
                        }
                    }

                    $controller = $that->loadController($controller);
                    if (!$controller) {
                        return new Response("No controller " . $handler . " found", 500);
                    }
                    if (!method_exists($controller, $handler)) {
                        return new Response("No controller handler " . $handler . "->" . $handler . " found", 500);
                    }
                    return $controller->$handler($request ?: new Request());
                });
            }
        }

    }

    /**
     * Lasy load controller to handle request
     * $controller : string
     **/
    private function loadController($controller)
    {
        $controller_file = $this->bundle_root . "/Controller/" . $controller . ".php";
        if (file_exists($controller_file)) {
            require_once $controller_file;
            $class_name = $this->bundle_namespace . "\\Controller\\" . str_replace("/", "\\", $controller);
            return new $class_name($this->app);
        } else {
            return null;
        }
    }

    /**
     * Load services to service manager
     */
    protected function initServices()
    {
        $services_service = $this->app->getServices();
        foreach ($this->services as $service_name => $service_relative_path) {
            $service_path = preg_replace("/\\/+/", "/", $this->bundle_root . "/Services/" . $service_relative_path . ".php");
            $service_class_name = preg_replace("/\\\\+/", "\\", $this->bundle_namespace . "\\Services\\" . str_replace("/", "\\", $service_relative_path));

            $services_service->set($service_name, $service_path, $service_class_name);
        }

    }

}