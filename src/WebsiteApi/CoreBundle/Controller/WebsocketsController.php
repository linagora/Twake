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

        $route = $request->request->get("collection_id", "");
        $data = $request->request->get("options", "");

        $result = $this->get("app.websockets")->init($route, $data, $this);
        if ($result) {
            return new JsonResponse(Array(
                "data" => Array(
                    "room_id" => $result["route_id"],
                    "key" => $result["key"],
                    "key_version" => $result["key_version"],
                    "get" => $result["get"]
                )
            ));
        }

        return new JsonResponse(Array("status" => "error"));

    }

    public function getService($service)
    {
        return $this->get($service);
    }

    public function getUser()
    {
        return parent::getUser();
    }

}