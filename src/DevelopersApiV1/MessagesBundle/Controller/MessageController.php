<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 05/06/18
 * Time: 15:46
 */

namespace DevelopersApiV1\MessagesBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class MessageController extends Controller
{

    public function removeMessageAction(Request $request)
    {

        $capabilities = [];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new JsonResponse($application);
        }

        $options = Array(
            "application_id" => $application->getId()
        );

        $object = $request->request->get("message", null);
        $chan_id = $object["channel_id"];

        if (!$object["ephemeral_id"]) {
            $result = $this->get("app.messages")->remove($object, $options);
        } else {
            $result = true;
        }

        if ($result) {

            $event = Array(
                "client_id" => "system",
                "action" => "remove",
                "object_type" => "",
                "front_id" => $object["front_id"]
            );
            $this->get("app.websockets")->push("messages/" . $chan_id, $event);

        }

        return new JsonResponse(Array("result" => $object));

    }

    public function saveMessageAction(Request $request)
    {

        $capabilities = ["messages_send"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new JsonResponse($application);
        }

        $object = $request->request->get("message", null);
        $chan_id = $object["channel_id"];

        $user = null;
        if (isset($object["sender"])) {
            $user = $this->get("app.users")->getById($object["sender"], true);
        }

        $object = $this->get("app.messages")->save($object, $options, $user, $application);

        $event = Array(
            "client_id" => "bot",
            "action" => "save",
            "object_type" => "",
            "object" => $object
        );
        $this->get("app.websockets")->push("messages/" . $chan_id, $event);

        return new JsonResponse(Array("result" => $object));

    }

}
