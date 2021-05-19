<?php


namespace Twake\Discussion\Services;

use App\App;
use Twake\Discussion\Entity\Message;
use \Firebase\JWT\JWT;

class MessageSystem
{

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->rest = $app->getServices()->get("app.restclient");
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->depreciated = $app->getServices()->get("app.messages.depreciated");
    }

    public function init($route, $data, $current_user = null)
    {
        return $this->depreciated->init($route, $data, $current_user);
    }

    public function hasAccess($data, $current_user = null, $message = null)
    {
        return $this->depreciated->hasAccess($data, $current_user, $message);
    }

    public function get($options, $current_user)
    {
        $offset = isset($options["offset"]) ? $options["offset"] : null;
        $limit = isset($options["limit"]) ? $options["limit"] : 60;
        $parent_message_id = isset($options["parent_message_id"]) ? $options["parent_message_id"] : "";

        $channel = $this->getInfosFromChannel($options["channel_id"]);   
        if(!$channel){
            return;
        }

        $response = $this->forwardToNode("GET", "/companies/".$channel["company_id"]."/workspaces/".$channel["workspace_id"]."/channels/".$channel["channel_id"]."/feed?replies_per_thread=3", [], $current_user);

        error_log(count($response["resources"]));

        $messages = [];
        foreach($response["resources"] as $message){
            $messages[] = $this->convertFromNode($message, $channel);
            foreach($message["last_replies"] as $reply){
                $messages[] = $this->convertFromNode($reply, $channel);
            }
        }


        if(count($messages) === 0
            && !$options["id"]
            && !$options["id"]
            && !$offset
            && $limit > 0
            && !$parent_message_id ){
            $init_message = Array(
                "channel_id" => $options["channel_id"],
                "hidden_data" => Array("type" => "init_channel")
            );
            return [$this->save($init_message, Array())];
        }

        return $messages;
    }

    public function remove($object, $options, $current_user = null)
    {
        return $this->depreciated->remove($object, $options, $current_user);
    }

    public function save($object, $options, $current_user = null, $application = null)
    {
        $channel = $this->getInfosFromChannel($object["channel_id"]);   
        if(!$channel){
            return;
        }

        $newMessage = !$object["id"];
        
        $message = $this->convertToNode($object);
        if(!$current_user){
            $message["subtype"] = "system";
        }
        if($application){
            $message["subtype"] = "application";
        }
        $message["context"]["_front_id"] = $object["front_id"];

        $response = null;
        
        //New thread
        if(!$object["parent_message_id"] && $newMessage){

            $data = [
                "resource" => [
                    "participants" => [
                        [
                            "type" => "channel",
                            "id" => $channel["channel_id"],
                            "workspace_id" => $channel["workspace_id"],
                            "company_id" => $channel["company_id"],
                        ]
                    ]
                ],
                "options" => []
            ];

            $response = $this->forwardToNode("POST", "/companies/".$channel["company_id"]."/threads", $data, $current_user, $application ? $application->getId() : null);
            error_log(json_encode($response));
            $object["parent_message_id"] = $response["resource"]["id"];
            $message["thread_id"] = $response["resource"]["id"];
            $message["id"] = $response["resource"]["id"];
        }

        error_log("message to save: ". json_encode($message));
        
        //New message in thread (also called for new threads because we set the parent_message_id automatically)
        if($object["parent_message_id"] && $newMessage){

            $data = [
                "resource" => $message
            ];

            $response = $this->forwardToNode("POST", "/companies/".$channel["company_id"]."/threads/".$object["parent_message_id"]."/messages", $data, $current_user, $application ? $application->getId() : null);

        }else

        //Edited message
        if(!$newMessage){

            $data = [
                "resource" => $message
            ];

            $response = $this->forwardToNode("POST", "/companies/".$channel["company_id"]."/threads/".$object["parent_message_id"]."/messages/".$object["id"], $data, $current_user, $application ? $application->getId() : null);

        }else {

            error_log("Unknown operation");

        }

        error_log(json_encode($response));

        //

        return $this->convertFromNode($response["resource"], $channel);
    }

    private function convertToNode($object){

        $blocks = [[
            "type" => "twacode",
            "content" => $object["content"]["formatted"] ?: $object["content"]["prepared"] ?: $object["content"]
        ]];

        $files = [];
        foreach(($object["files"] ?: []) as $file){
            if($file["type"] == "file"){
                $files[] = [
                    "id" => $file["content"],
                    "metadata" => [
                        "source" => "drive",
                        "external_id" => $file["content"]
                    ]
                ];
            }
        }

        return [
            "text" => $object["content"]["original_str"] ?: $object["content"]["fallback_string"],
            "blocks" => $blocks,
            "files" => $files,
            "context" => $object["hidden_data"]
        ];
    }

    private function convertFromNode($message, $channel){

        if($message["last_replies"] || $message["thread_id"] === $message["id"]){
            $message["thread_id"] = "";
        }

        $phpMessage = new Message($channel["channel_id"], $message["thread_id"]);

        $phpMessage->setId($message["id"]);
        $phpMessage->setFrontId($message["context"]["_front_id"] ?: $message["id"]);
        $phpMessage->setSender($message["user_id"]);
        $phpMessage->setApplicationId($message["application_id"]);
        $phpMessage->setMessageType($message["subtype"] == "application" ? 1 : ($message["subtype"] == "system" ? 2 : 0));
        $phpMessage->setHiddenData($message["context"]);
        $phpMessage->setPinned(!!$message["pinned"]);
        $phpMessage->setEdited(!!$message["edited"]);
        $phpMessage->setCreationDate(new \DateTime("@" . intval(($message["last_activity"] ?: $message["created_at"]) / 1000)));
        $phpMessage->setModificationDate(new \DateTime("@" . intval($message["created_at"] / 1000)));

        $phpMessage->setContent([
            "fallback_string" => $message["text"],
            "original_str" => $message["text"],
            "files" => $message["files"],
            "prepared" => $message["blocks"][0]["content"]
        ]);

        return $phpMessage->getAsArray();
    }

    private function getInfosFromChannel($channelId){
        $channelDetails = $this->doctrine->getRepository("Twake\Core:CachedFromNode")->findOneBy(Array("company_id" => "unused", "type" => "channel", "key"=>$channelId));
        if($channelDetails){
            return $channelDetails->getData();
        }
        return null;
    }

    private function forwardToNode($method, $route, $data = [], $user = null, $applicationId = null){

        $uri = str_replace("/private", "/internal/services/messages/v1", $this->app->getContainer()->getParameter("node.api")) . 
            ltrim($route, "/");
       
        error_log($user);

        $key = $this->app->getContainer()->getParameter("jwt.secret");
        $payload = [
            "exp" => date("U") + 60,
            "type" => "access",
            "iat" => intval(date("U")) - 60*10,
            "nbf" => intval(date("U")) - 60*10,
            "sub" => $user ? $user->getId() : null,
            "email" => $user ? $user->getEmail() : null,
            "application_id" => $applicationId,
            "server_request" => true
        ];
        $jwt = JWT::encode($payload, $key);

        $opt = [
            CURLOPT_HTTPHEADER => Array(
                "Authorization: Bearer " . $jwt,
                "Content-Type: application/json"
            ),
            CURLOPT_CONNECTTIMEOUT => 1,
            CURLOPT_TIMEOUT => 1
        ];

        $res = $this->rest->request($method, $uri, json_encode($data), $opt);

        $res = $res->getContent();
        $res = json_decode($res, 1);
        return $res;
    }

}
