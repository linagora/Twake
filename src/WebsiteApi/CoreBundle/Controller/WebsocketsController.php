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

        $multiple_request = $request->request->get("multiple", false);
        $multiple = $multiple_request;
        if (!$multiple_request) {
            $multiple = [Array(
                "collection_id" => $request->request->get("collection_id", ""),
                "options" => $request->request->get("options", "")
            )];
        }

        $final_result = [];

        foreach ($multiple as $item) {
            $route = $item["collection_id"];
            $data = $item["options"];

            try {
                $result = $this->get("app.websockets")->init($route, $data, $this);
                if ($result) {
                    $final_result[] = Array(
                        "data" => Array(
                            "room_id" => $result["route_id"],
                            "key" => $result["key"],
                            "key_version" => $result["key_version"],
                            "get" => $result["get"]
                        )
                    );
                } else {
                    $final_result[] = Array("status" => "error_service_not_found_or_not_allowed");
                }
            } catch (\Exception $e) {
                $final_result[] = Array("status" => "error_service_not_found_or_not_allowed");
            }

        }

        if (!$multiple_request) {
            $final_result = $final_result[0];
        } else {
            $final_result = Array("data" => $final_result);
        }

        return new JsonResponse($final_result);

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