<?php

namespace DevelopersApi\MessagesBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class DefaultController extends Controller
{
    public function newAction(Request $request)
    {
        $request = $this->get("api.CheckRightApplication")->getRequestData($request, Array("messages/write"));
        $requestData = $request["data"];

        if (isset($request["errors"])) {
            return new JsonResponse($request["errors"]);
        }

        $workspaceId = $request["workspace"]->getId();
        $streamId = isset($requestData["streamId"]) ? $requestData["streamId"] : 0;
        $subjectId = isset($requestData["subjectId"]) ? intval($requestData["subjectId"]) : 0;
        $userId = isset($requestData["userId"]) ? $requestData["userId"] : 0;
        $url = isset($requestData["url"]) ? $requestData["url"] : "";
        $appid = $request["application"]->getId();
        $responseTo = isset($requestData["respondTo"]) ? intval($requestData["respondTo"]) : 0;

        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $message = $this->get("app.messages")->sendMessage($userId, "s-" . $streamId, true, $appid, false, null, $workspaceId, $subjectId, Array("iframe" => $url), true, "", $responseTo);

        if (!$message) {
            $data["errors"][] = 3001;
        } else {
            $data["data"] = "success";
        }

        return new JsonResponse($data);

    }
}
