<?php

namespace Twake\Core\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Websockets extends BaseController
{

    public function init(Request $request)
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

        $wss = $this->get("app.websockets");

        foreach ($multiple as $item) {
            $route = $item["collection_id"];
            $data = $item["options"];

            try {
                $result = $wss->init($route, $data, $this);
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
                log_exception($e);
                $final_result[] = Array("status" => "error_service_not_found_or_not_allowed");
            }

        }

        if (!$multiple_request) {
            $final_result = $final_result[0];
        } else {
            $final_result = Array("data" => $final_result);
        }

        return new Response($final_result);

    }

}