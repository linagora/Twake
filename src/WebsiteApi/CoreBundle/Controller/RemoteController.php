<?php

namespace WebsiteApi\CoreBundle\Controller;

use RMS\PushNotificationsBundle\Message\iOSMessage;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\RememberMeToken;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class RemoteController extends Controller
{

    public function mailAction(Request $request)
    {

        $remoteLicenceKey = $request->request->get("licenceKey", "");
        $remoteIp = $request->getClientIp();

        $licenceServer = "https://licences.twakeapp.com/api";
        $licenceKey = $this->container->getParameter('LICENCE_KEY');
        $data = Array(
            "licenceKey" => $licenceKey,
            "remoteLicenceKey" => $remoteLicenceKey,
            "remoteIp" => $remoteIp
        );
        $result = $this->get("circle.restclient")->post($licenceServer . "/verifyRemote", json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 60));
        $result = json_decode($result->getContent(), true);

        if (!isset($result["status"]) || $result["status"] == "valid") {
            return new JsonResponse(Array("status" => "error", "error" => $result["error"]));
        }

        //TODO Send mails to send

        return new JsonResponse(Array("status" => "success"));

    }

    public function pushAction(Request $request)
    {

        $remoteLicenceKey = $request->request->get("licenceKey", "");
        $remoteIp = $request->getClientIp();

        $licenceServer = "https://licences.twakeapp.com/api";
        $licenceKey = $this->container->getParameter('LICENCE_KEY');
        $data = Array(
            "licenceKey" => $licenceKey,
            "remoteLicenceKey" => $remoteLicenceKey,
            "remoteIp" => $remoteIp
        );
        $result = $this->get("circle.restclient")->post($licenceServer . "/verifyRemote", json_encode($data), array(CURLOPT_CONNECTTIMEOUT => 60));
        $result = json_decode($result->getContent(), true);

        if (!isset($result["status"]) || $result["status"] == "valid") {
            return new JsonResponse(Array("status" => "error", "error" => $result["error"]));
        }

        //TODO Push objects to push

        return new JsonResponse(Array("status" => "success"));

    }

}