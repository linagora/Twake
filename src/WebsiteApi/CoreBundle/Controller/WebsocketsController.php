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

        $result = $this->get("app.websockets")->init();
        if ($result) {
            return new JsonResponse(Array(
                "data" => Array(
                    "room_id" => $result["route"],
                    "key" => $result["key"],
                    "key_version" => $result["key_version"]
                )
            ));
        }

        return new JsonResponse(Array("status" => "error"));

    }

}