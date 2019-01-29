<?php

namespace WebsiteApi\CoreBundle\Controller;

use RMS\PushNotificationsBundle\Message\iOSMessage;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\RememberMeToken;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class WebsocketsController extends Controller
{

    public function initAction(Request $request)
    {

        $route = $request->request->get("route", "");
        $data = $request->request->get("data", "");

        $result = $this->get("app.websockets")->init($route, $data);
        if ($result) {
            return new JsonResponse(Array(
                "data" => Array(
                    "room_id" => $result["route_id"],
                    "key" => $result["key"],
                    "key_version" => $result["key_version"]
                )
            ));
        }

        return new JsonResponse(Array("status" => "error"));

    }

    public function removeAction(Request $request)
    {
        $object = $request->request->get("object");
        return new JsonResponse(Array("data" => Array("object" => $object)));
    }

    public function saveAction(Request $request)
    {

        $object = $request->request->get("object");
        if (!isset($object["id"])) {
            $object["id"] = "1-" . date("U") . "-" . random_int(0, 1000);
        }
        return new JsonResponse(Array("data" => Array("object" => $object)));
    }

    public function getAction(Request $request)
    {
        $objects = Array(Array(
                "test" => 1,
                "front_id" => "805d856a-54bb-5bc5-3e94-042b2a5977cc",
                "id" => "a-1234-1"
            ),
            /*
                        Array(
                            "test" => 2,
                            "front_id" => "805d856a-54bb-5bc5-3e94-042b2a5977ca",
                            "id" => "a-1234-2"
                        ),

                        Array(
                            "test" => 3,
                            "front_id" => "805d856a-54bb-5bc5-3e94-042b2a5977cd",
                            "id" => "a-1234-3"
                        ),

                        Array(
                            "test" => 4,
                            "front_id" => "805d856a-54bb-5bc5-3e94-042b2a5977cg",
                            "id" => "a-1234-4"
                        )*/
        );


        return new JsonResponse(Array("data" => $objects));
    }

}