<?php

namespace Twake\Core\Controller;

use Common\BaseController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

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

        return new JsonResponse(Array("data" => $response));

    }

    private function routeToControllerName($routename)
    {
        if ($routename == "/ajax/core/collections/init") {
            return "TwakeCore:Websockets:init";
        }
        if ($routename == "/ajax/notifications/get") {
            return "TwakeNotifications:Default:get";
        }
        if ($routename == "/ajax/channels/get") {
            return "TwakeChannels:Channels:get";
        }
        if ($routename == "/ajax/channels/direct_messages/get") {
            return "TwakeChannels:DirectMessages:get";
        }
        if ($routename == "/ajax/discussion/get") {
            return "TwakeDiscussion:Discussion:get";
        }
    }

}
