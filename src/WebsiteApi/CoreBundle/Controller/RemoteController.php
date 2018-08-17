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

        //[REMOVE_ONPREMISE]
        if ($this->container->getParameter('STANDALONE')) {

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

            if (!isset($result["status"]) || $result["status"] != "valid") {
                return new JsonResponse(Array("status" => "error", "error" => $result));
            }

            $mail = $request->request->get("mail", "");
            $html = $request->request->get("html", "");
            $this->get("app.twake_mailer")->sendHTML($mail, $html);

            return new JsonResponse(Array("status" => "success"));

        }
        //[/REMOVE_ONPREMISE]
        return new JsonResponse(Array("status" => "error"));

    }

    public function verifyReCaptchaAction(Request $request)
    {
        //[REMOVE_ONPREMISE]

        if ($this->container->getParameter('STANDALONE')) {

            $secret = "6LeXo1oUAAAAACHfOq50_H9n5W56_5rQycvT_IaZ";

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

            if (!isset($result["status"]) || $result["status"] != "valid") {
                return new JsonResponse(Array("status" => "error", "error" => $result));
            }

            $recaptcha = $request->request->get("recaptcha", "");
            $ip = $request->request->get("client_ip", "");

            $api_url = "https://www.google.com/recaptcha/api/siteverify?secret="
                . $secret
                . "&response=" . $recaptcha
                . "&remoteip=" . $ip;

            $decode = json_decode(file_get_contents($api_url), true);

            return new JsonResponse(Array("status" => $decode["success"]));

        }
        //[/REMOVE_ONPREMISE]
        return new JsonResponse(Array("status" => "error"));

    }

    public function pushAction(Request $request)
    {
        //[REMOVE_ONPREMISE]

        if ($this->container->getParameter('STANDALONE')) {

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

            if (!isset($result["status"]) || $result["status"] != "valid") {
                return new JsonResponse(Array("status" => "error", "error" => $result));
            }

            $data_array = $request->request->get("data", Array());

            if (isset($data_array["type"])) {
                $data_array = Array($data_array);
            }

            foreach ($data_array as $data) {

                $type = $data["type"];
                $deviceId = $data["device_id"];
                $message = $data["message"];
                $title = $data["title"];
                $badge = $data["badge"];
                $more_data = $data["data"];

                $this->get("app.notifications")->pushDeviceInternal($type, $deviceId, $message, $title, $badge, $more_data);

            }

            return new JsonResponse(Array("status" => "success"));

        }
        //[/REMOVE_ONPREMISE]
        return new JsonResponse(Array("status" => "error"));

    }

}