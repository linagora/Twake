<?php

namespace Twake\Core\Services;

use App\App;

class AccessManager
{

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->memberservice = $app->getServices()->get("app.workspace_members");
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


//        $workspaces_acces = $this->memberservice->getWorkspaces($current_user_id);
//        $workspaces = Array(); //liste des workspace dont on a accces;
//        foreach ($workspaces_acces as $workspace_obj){
//            $value = $workspace_obj["workspace"]->getAsArray();
//            $workspaces[$value["id"]] = $value["id"];
//        }


        if ($type == "Workspace") {
            if (!$this->user_has_workspace_access($current_user_id, $id)) {
                return false;
            }
        } else if ($type == "Channel") {

            
            $channel = $this->doctrine->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $id));
            if (isset($channel)) {
                $channel = $channel->getAsArray();
                $workspace_id = $channel["original_workspace"];
                $members = $channel["members"];
                $ext_members = $channel["ext_members"];
                if($edition && !$this->user_has_workspace_access($current_user_id, $channel["original_workspace"])){
                    return false;
                }
                $linkChannel = $this->doctrine->getRepository("Twake\Channels:ChannelMember")->findOneBy(Array("direct" => false, "user_id" => $current_user_id . "", "channel_id" => $id));
                if ($linkChannel) {
                    return true;
                }
                if (in_array($current_user_id, $members) || in_array($current_user_id, $ext_members)) {
                    return true;
                } else
                    if (!$this->user_has_workspace_access($current_user_id, $workspace_id) || ((!in_array($current_user_id, $members)) && (!in_array($current_user_id, $ext_members)))) {
                        return false;
                    }
            } else {
                return false;
            }
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
                } else
                    if ($this->user_has_workspace_access($current_user_id, $workspace_id)) {
                        return true;
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

}
