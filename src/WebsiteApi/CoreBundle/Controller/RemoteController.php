<?php

namespace WebsiteApi\CoreBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

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
            $attachments = $request->request->get("attachments", Array());
            $this->get("app.twake_mailer")->sendHTML($mail, $html, $attachments);

            return new JsonResponse(Array("status" => "success"));

        }
        //[/REMOVE_ONPREMISE]
        return new JsonResponse(Array("status" => "error"));

    }

    public function verifyReCaptchaAction(Request $request)
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

            $recaptcha = $request->request->get("recaptcha", "");
            $ip = $request->request->get("client_ip", "");

            $res = $this->get("app.user")->verifyReCaptchaAction($recaptcha, $ip);

            return new JsonResponse(Array("status" => $res ? "success" : "error"));

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