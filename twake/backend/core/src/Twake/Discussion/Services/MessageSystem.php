<?php


namespace Twake\Discussion\Services;

use App\App;
use Twake\Discussion\Entity\Message;

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
        $channel = $this->getInfosFromChannel($options["channel_id"]);   
        if(!$channel){
            return;
        }

        $response = $this->forwardToNode("GET", "/companies/".$channel["company_id"]."/workspaces/".$channel["workspace_id"]."/channels/".$channel["channel_id"]."/feed?replies_per_thread=3");

        error_log(json_encode($response));

        $messages = [];
        foreach($response["resources"] as $message){
            $messages[] = $this->convertFromNode($message, $channel);
        }


        return $messages;
    }

    public function remove($object, $options, $current_user = null)
    {
        return $this->depreciated->remove($object, $options, $current_user);
    }
    
    public function save($object, $options, $user = null, $application = null)
    {
        $channel = $this->getInfosFromChannel($object["channel_id"]);   
        if(!$channel){
            return;
        }
        
        $message = $this->convertToNode($object);

        $response = null;
        
        //New thread
        if(!$object["parent_message_id"] && !$object["id"]){

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

            $response = $this->forwardToNode("POST", "/companies/".$channel["company_id"]."/threads", $data);
            error_log(json_encode($response));
            $object["parent_message_id"] = $response["resource"]["id"];
        }
        
        //New message in thread (also called for new threads because we set the parent_message_id automatically)
        if($object["parent_message_id"] && !$object["id"]){

            $data = [
                "resource" => $message
            ];

            $response = $this->forwardToNode("POST", "/companies/".$channel["company_id"]."/threads/".$object["parent_message_id"]."/messages", $data);

        }else

        //Edited message
        if($object["id"]){

            $data = [
                "resource" => $message
            ];

            $response = $this->forwardToNode("POST", "/companies/".$channel["company_id"]."/threads/".$object["parent_message_id"]."/messages/".$object["id"], $data);

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
            "content" => $object["content"]["formatted"] ?: $object["content"]["prepared"]
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

        $phpMessage = new Message($channel["channel_id"], $message["thread_id"]);

        $phpMessage->setId($message["id"]);
        $phpMessage->setFrontId($message["id"]);
        $phpMessage->setSender($message["user_id"]);
        $phpMessage->setApplicationId($message["application_id"]);
        $phpMessage->setMessageType($message["subtype"] == "application" ? 1 : ($message["subtype"] == "system" ? 2 : 0));
        $phpMessage->setHiddenData($message["context"]);
        $phpMessage->setPinned(!!$message["pinned"]);
        $phpMessage->setEdited(!!$message["edited"]);

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

    private function forwardToNode($method, $route, $data = []){
        $uri = str_replace("/private", "/internal/services/messages/v1", $this->app->getContainer()->getParameter("node.api")) . 
            ltrim($route, "/");

        $opt = [
            CURLOPT_HTTPHEADER => Array(
                "Authorization: " . getallheaders()["Authorization"],
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
