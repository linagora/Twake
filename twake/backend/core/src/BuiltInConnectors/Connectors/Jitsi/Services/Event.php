<?php

namespace BuiltInConnectors\Connectors\Jitsi\Services;

class Event
{

    public function __construct($app) {
        $this->main_service = $app->getServices()->get("connectors.common.main");
    }

    public function getUserFromId($room_id, $user_id, $group_id = null){
        $this->main_service->setConnector("jitsi");

        $user_object = $this->main_service->postApi("users/get", Array("user_id" => $user_id, "group_id" => $group_id));
        return $user_object["object"];
    }

    public function proceedEvent($type, $event, $data)
    {
        $this->main_service->setConnector("jitsi");

        $group = $data["group"];
        $user = $data["user"];
        $message = $data["message"];
        $channel = $data["channel"];
        $parent_message = $data["parent_message"];
        $creator = $data["user"];

        if ($type == "action" && ($event == "command" || $event == "open")) {

          $message = [
            "channel_id" => $channel["id"],
            "content" => Array(
                Array("type"=>"system", "content"=>"Choose a subject for your call"),
                Array("type"=>"br"),
                Array("type"=>"input", "content" => $data["command"], "placeholder" => "Meeting about ...", "passive_id" => "meeting_name"),
                Array("type"=>"br"),
                Array("type"=>"button", "style"=>"default", "action_id"=>"cancel", "content"=>"Cancel"),
                Array("type"=>"button", "style"=>"primary", "action_id"=>"create", "content"=>"Create")
            ),
            "hidden_data" => Array(
            ),
            "parent_message_id" => isset($parent_message["id"])?$parent_message["id"]:"",
            "ephemeral_message_recipients" => [$user["id"]],
            "_once_ephemeral_message" => true
          ];

          $data_string = Array(
              "group_id" => $group["id"],
              "message" => $message
          );
          $message = $this->main_service->postApi("messages/save", $data_string);

        }

        if ($type == "interactive_message_action" && $event == "cancel") {

            $data_string = Array(
                "group_id" => $group["id"],
                "message" => $data["message"]
            );

            $this->main_service->postApi("messages/remove", $data_string);

        }

        if ($type == "interactive_message_action" && $event == "create") {

            $original_message = $message;

            $room_id = $group["id"]."__".$original_message["channel_id"];

            $url = rtrim($this->main_service->getServerBaseUrl(), "/") . "/jitsi/call/twake_" . str_replace("-", "_", $room_id);

            $message = [];
            $message["channel_id"] = $original_message["channel_id"];
            $message["sender"] = $user["id"];
            $message["parent_message_id"] = isset($original_message["parent_message_id"])?$original_message["parent_message_id"]:"";
            $message["content"] = Array(
                ["type" => "system", "content" => ["@" . $creator["username"] . " invite you to join the call ", ["type" => "bold", "content" => $data["form"]["meeting_name"]],". "]],
                ["type" => "system", "content" => ["type" => "button", "inline" => "true", "style"=>"primary", "action_id"=>"show_link", "content" => "Show call link"]],
                ["type" => "br"],
                ["type" => "url", "user_identifier" => true, "url" => $url, "content" => ["type" => "button", "content" => ["Join call ", ["type" => "bold", "content" => $data["form"]["meeting_name"]]]]]);
            $message["hidden_data"] = Array(
                "allow_delete" => "everyone",
                "room_id" => $room_id
            );

            $data_string = Array(
                "group_id" => $group["id"],
                "message" => $data["message"]
            );
            $this->main_service->postApi("messages/remove", $data_string);

            $data_string = Array(
                "group_id" => $group["id"],
                "message" => $message
            );

            $message = $this->main_service->postApi("messages/save", $data_string);

            $message_id = $message["object"]["id"];

        }

        if ($type == "interactive_message_action" && $event == "show_link") {

            $room_id = $message["hidden_data"]["room_id"];

            $url = rtrim($this->main_service->getServerBaseUrl(), "/") . "/jitsi/call/twake_" . str_replace("-", "_", $room_id);

            $display = Array(
                    "type" => "system", "content" => [
                        "Partagez ce lien avec les participants de l'appel.",
                        Array("type" => "br"),
                        Array("type" => "copiable", "content" => $url)
                    ]
            );

            $data_string = Array(
                "group_id" => $group["id"],
                "user_id" => $data["user"]["id"],
                "connection_id" => $data["connection_id"],
                "form" => $display
            );
            $this->main_service->postApi("general/configure", $data_string);

        }

    }

}
