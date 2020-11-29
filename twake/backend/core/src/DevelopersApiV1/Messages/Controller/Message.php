<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 05/06/18
 * Time: 15:46
 */

namespace DevelopersApiV1\Messages\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;


class Message extends BaseController
{

    public function removeMessage(Request $request)
    {

        $capabilities = [];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $options = Array(
            "application_id" => $application->getId()
        );

        $object = $request->request->get("message", null);
        $chan_id = $object["channel_id"];

        if (!$object["ephemeral_id"]) {
            $result = $this->get("app.messages")->remove($object, $options);
            $front_id = $result["front_id"];
        } else {
            $result = true;
            $front_id = $object["front_id"];
        }

        if ($result) {

            $event = Array(
                "client_id" => "system",
                "action" => "remove",
                "object_type" => "",
                "front_id" => $front_id
            );
            $this->get("app.websockets")->push("messages/" . $chan_id, $event);

        }

        $this->get("administration.counter")->incrementCounter("total_api_messages_operation", 1);

        return new Response(Array("result" => $object));

    }

    public function saveMessage(Request $request)
    {

        $capabilities = ["messages_save"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $object = $request->request->get("message", null);
        $chan_id = $object["channel_id"];

        $user = null;
        if (isset($object["sender"])) {
            $user = $this->get("app.users")->getById($object["sender"], true);
        }

        try {
            $object = $this->get("app.messages")->save($object, Array(), $user, $application);
        } catch (\Exception $e) {
            $object = false;
        }

        if (!$object) {
            return new Response(Array("error" => "unknown error or malformed query."));
        }

        if (isset($object["message"])) {
            if (isset($object["message"]["formatted"])) {
                $object["content"]["last_change"] = date("U");
            } else {
                $object["content"]["formatted"] = $object["content"];
                $object["content"]["last_change"] = date("U");
            }
        }

        $event = Array(
            "client_id" => "bot",
            "action" => "save",
            "object_type" => "",
            "object" => $object
        );
        $this->get("app.websockets")->push("messages/" . $chan_id, $event);

        $event = Array(
            "client_id" => "system",
            "action" => "update",
            "message_id" => $object["id"],
            "thread_id" => $object["parent_message_id"]
        );
        $this->get("app.pusher")->push($event, "channels/" . $object["channel_id"] . "/messages/updates");

        $this->get("administration.counter")->incrementCounter("total_api_messages_operation", 1);

        return new Response(Array("object" => $object));

    }

}
