<?php

namespace Twake\Core\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class GroupedQuery extends BaseController
{

    public function query(Request $request)
    {

        $requests = $request->request->get("request");
        $response = [];

        foreach ($requests as $_request) {
            $route = $_request["route"];
            $data = $_request["data"];
            $request->request->replace($data);

            $controller = $this->routeToControllerName($route);

            if ($controller) {

                $tmp = $this->forward($controller, array('request' => $request));
                $response[] = Array(
                    "route" => $route,
                    "data" => json_decode($tmp->getContent(), true)
                );

            } else {
                $response[] = Array(
                    "route" => $route,
                    "data" => Array("error" => "controller_was_not_found")
                );
            }
        }

        return new Response(Array("data" => $response));

    }

    private function routeToControllerName($routename)
    {
        if ($routename == "/ajax/core/collections/init") {
            return "Twake\Core:Websockets:init";
        }
        if ($routename == "/ajax/notifications/get") {
            return "Twake\Notifications:Default:get";
        }
        if ($routename == "/ajax/channels/get") {
            return "Twake\Channels:Channels:get";
        }
        if ($routename == "/ajax/channels/direct_messages/get") {
            return "Twake\Channels:DirectMessages:get";
        }
        if ($routename == "/ajax/discussion/get") {
            return "Twake\Discussion:Discussion:get";
        }
    }

}
