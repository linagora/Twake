<?php

namespace WebsiteApi\CoreBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class GroupedQueryController extends Controller
{

    public function queryAction(Request $request)
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
            return "TwakeCoreBundle:Websockets:init";
        }
        if ($routename == "/ajax/notifications/get") {
            return "TwakeNotificationsBundle:Default:get";
        }
        if ($routename == "/ajax/channels/get") {
            return "TwakeChannelsBundle:Channels:get";
        }
        if ($routename == "/ajax/channels/direct_messages/get") {
            return "TwakeChannelsBundle:DirectMessages:get";
        }
        if ($routename == "/ajax/discussion/get") {
            return "TwakeDiscussionBundle:Discussion:get";
        }
    }

}
