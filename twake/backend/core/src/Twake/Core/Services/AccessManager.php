<?php

namespace Twake\Core\Services;

use App\App;
use Twake\Core\Entity\CachedFromNode;
use Emojione\Client;
use Emojione\Ruleset;
class AccessManager
{

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->rest = $app->getServices()->get("app.restclient");
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->memberservice = $app->getServices()->get("app.workspace_members");
        $this->emojione_client = new Client(new Ruleset());
    }

    public function has_access($current_user_id, $data, $options = null)
    {
        if ($current_user_id && !is_string($current_user_id)) {
            $current_user_id = $current_user_id->getId();
        }

        $type = @$data["type"];
        $edition = @$data["edition"]; //TODO test if we have edition access (everybodyhas edition acess for now)
        $id = @$data["object_id"];


        //FONCTION POUR SAVOIR SI UN UTILISATEUR A ACCES A QUELQUE CHOSE


        if ($type == "Workspace") {
            if (!$this->user_has_workspace_access($current_user_id, $id)) {
                return false;
            }
        } else if ($type == "Channel") {

            //Use new node backend for this and cache result
            $userId = $current_user_id;
            $channelId = $id;

            $getChannelCache = false;
            $channelDetails = $this->doctrine->getRepository("Twake\Core:CachedFromNode")->findOneBy(Array("company_id" => "unused", "type" => "channel", "key"=>$channelId));
            if($channelDetails){
                $companyId = $channelDetails->getData()["company_id"];
                $workspaceId = $channelDetails->getData()["workspace_id"];
                if($channelDetails->getData()["last_update"] < date("U") - 0 * 60 * 60){
                    $getChannelCache = true;
                }
            }else{
                $getChannelCache = true;
            }
            $getChannelCache = true;

            if($options["company_id"] && $options["workspace_id"]){
                $companyId = $options["company_id"];
                $workspaceId = $options["workspace_id"];
            }

            $cacheKey = $userId."_".$channelId;
            $data = $this->doctrine->getRepository("Twake\Core:CachedFromNode")->findOneBy(Array("company_id" => "unused", "type" => "access_channel", "key"=>$cacheKey));
            if(!$data || !$data->getData()["has_access"]){

                try{

                    $res = $this->callNode(
                        "companies/".$companyId."/workspaces/".$workspaceId."/".
                        "channels/".$channelId."/members/".$userId."/exists"
                    );

                    try{

                        if($res && isset($res["has_access"])){
            
                            $hasAccess = $res["has_access"] == true;

                            if($getChannelCache){
                                $this->getChannelCache($companyId, $workspaceId, $channelId);
                            }

                        }

                    }catch(\Exception $err){
                        error_log($err);
                    }

                    $cache = new CachedFromNode("unknown", "access_channel", $cacheKey, [
                        "has_access" => $hasAccess
                    ]);
                    $this->doctrine->persist($cache);
                    $this->doctrine->flush();

                    return $hasAccess;

                    
                }catch(\Exception $err){
                    error_log($err);
                }

                return false;
            }

            return true;

        } else if ($type == "Message") {
            $message = $this->doctrine->getRepository("Twake\Discussion:Message")->findOneBy(Array("id" => $id));
            if (isset($message)) {
                $message = $message->getAsArray();
                $channel_id = $message["channel_id"];
                $data = Array("type" => "Channel", "object_id" => $channel_id);
                if (!$this->has_access($current_user_id, $data)) {
                    return false;
                }
            } else {
                return false;
            }
        } else if ($type == "DriveFile") { //Read parent id and detached from file to get access

            if ($id == "root" || $id == "trash" || $id == "") {
                if (!$data["workspace_id"]) {
                    return false;
                }
                return $this->has_access($current_user_id, Array("type" => "Workspace", "object_id" => $data["workspace_id"]));
            }

            if (!$id) {
                return false;
            }
            $df = $this->doctrine->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $id));

            if ($df) {

                $df = $df->getAsArray();
                $workspace_id = $df["workspace_id"];

                // Public access token
                if (!empty($df["acces_info"]["token"]) && !empty($options["token"]) && $df["acces_info"]["token"] != $options["token"]) {
                    return false;
                }
                if (isset($df["acces_info"]["token"]) && $df["acces_info"]["token"] == "" && isset($options["token"]) && $options["token"] == "") {
                    return false;
                }
                if (isset($df["acces_info"]["token"]) && isset($options["token"]) && $df["acces_info"]["token"] == $options["token"]) {
                    return true;
                }

                //In this case only members authorized can see the directory
                if (isset($df["acces_info"]["authorized_members"]) && is_array($df["acces_info"]["authorized_members"])) {
                    if (in_array($current_user_id, $df["acces_info"]["authorized_members"])) {
                        return true;
                    } else {
                        return false;
                    }
                }

                //In this case defined has special access authorization
                if (isset($df["acces_info"]["authorized_channels"]) && is_array($df["acces_info"]["authorized_channels"])) {
                    $channels = $df["acces_info"]["authorized_channels"];
                    $access = false;
                    foreach ($channels as $channel) {
                        $data = Array("type" => "Channel", "object_id" => $channel);
                        if ($this->has_access($current_user_id, $data)) {
                            $access = true;
                        }
                    }
                    if ($access) {
                        return true;
                    }
                }

                //Access to workspace
                if (!$workspace_id) {
                    return true;
                } else {
                    if ($this->user_has_workspace_access($current_user_id, $data["workspace_id"] ?: $workspace_id)) {
                        return true;
                    }
                }

            }

            return false;

        } else if ($type == "Calendar") { //pensez au parent id tous ca tous ca et a detached
            $calendar = $this->doctrine->getRepository("Twake\Calendar:Calendar")->findOneBy(Array("id" => $id));
            if (isset($calendar)) {
                $calendar = $calendar->getAsArray();
                $workspace_id = $calendar["workspace_id"];
                if (!$this->user_has_workspace_access($current_user_id, $workspace_id)) {
                    return false;
                }
            } else {
                return false;
            }
        }


        return true;
    }

    public function user_has_workspace_access($current_user_id, $workspace_id)
    {
        return $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser")->findOneBy(Array("workspace_id" => $workspace_id, "user_id" => $current_user_id));
    }

    private function callNode($route){
        $secret = $this->app->getContainer()->getParameter("node.secret");
        $uri = $this->app->getContainer()->getParameter("node.api") . 
            $route;

        $res = $this->rest->get($uri, [
            CURLOPT_HTTPHEADER => Array(
                "Authorization: Token ".$secret,
                "Content-Type: application/json"
            ),
            CURLOPT_CONNECTTIMEOUT => 1,
            CURLOPT_TIMEOUT => 1
        ]);
        $res = $res->getContent();
        $res = json_decode($res, 1);
        return $res;
    }

    public function getChannelCache($companyId, $workspaceId, $channelId){
        $path = "companies/".$companyId
            ."/workspaces/".$workspaceId."/"
            ."channels/".$channelId;

        if(!$workspaceId){
            $path = "companies/".$companyId
                ."/channels/".$channelId;
        }

        $resChannel = $this->callNode($path);

        $name = $resChannel["icon"] . " " . $resChannel["name"];
        if($resChannel["workspace_id"] === "direct"){
            $name = "";
        }

        $name = html_entity_decode($this->emojione_client->shortnameToUnicode($name), ENT_NOQUOTES, 'UTF-8');

        $workspaceId = $workspaceId ?: $resChannel["workspace_id"];

        $workspace = $this->doctrine->getRepository("Twake\Workspaces:Workspace")->findOneBy(Array("id" => $workspaceId));
        $group = $this->doctrine->getRepository("Twake\Workspaces:Group")->findOneBy(Array("id" => $companyId));
        $workspaceName = $workspace ? $workspace->getName() : "";
        $companyName = $group ? $group->getDisplayName() : "";

        $cacheChannel = new CachedFromNode("unused", "channel", $resChannel["id"], [
            "company_id" => $resChannel["company_id"],
            "workspace_id" => $resChannel["workspace_id"],
            "channel_id" => $resChannel["id"],
            "is_direct" => $resChannel["workspace_id"] === "direct",
            "name" => $name,
            "workspace_name" => $workspaceName,
            "company_name" => $companyName,
            "last_update" => date("U")
        ]);
        $this->doctrine->persist($cacheChannel);
        $this->doctrine->flush();
    }

}
