<?php

namespace WebsiteApi\CoreBundle\Services;

class AccessManager
{

    public function __construct($doctrine, $memberservice)
    {
        $this->doctrine = $doctrine;
        $this->memberservice = $memberservice;
    }

    public function has_access($current_user_id, $data, $options = null){

        if ($current_user_id && !is_string($current_user_id)) {
            $current_user_id = $current_user_id->getId();
        }

        $type = $data["type"];
        $edition = $data["edition"]; //TODO test if we have edition access (everybodyhas edition acess for now)
        $id = $data["object_id"];


        //FONCTION POUR SAVOIR SI UN UTILISATEUR A ACCES A QUELQUE CHOSE


//        $workspaces_acces = $this->memberservice->getWorkspaces($current_user_id);
//        $workspaces = Array(); //liste des workspace dont on a accces;
//        foreach ($workspaces_acces as $workspace_obj){
//            $value = $workspace_obj["workspace"]->getAsArray();
//            $workspaces[$value["id"]] = $value["id"];
//        }


        if($type == "Workspace"){
            if(!$this->user_has_workspace_access($current_user_id,$id)){
                return false;
            }
        }

        else if($type == "Channel"){
            $channel = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $id));
            if(isset($channel)){
                $channel = $channel->getAsArray();
                $workspace_id = $channel["original_workspace"];
                $members = $channel["members"];
                $ext_members = $channel["ext_members"];
                if (in_array($current_user_id, $members) || in_array($current_user_id, $ext_members)) {
                    return true;
                } else
                    if (!$this->user_has_workspace_access($current_user_id, $workspace_id) || ((!in_array($current_user_id, $members)) && (!in_array($current_user_id, $ext_members)))) {
                        return false;
                    }
            }
            else{
                return false;
            }
        }

        else if($type == "Message"){
            $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $id));
            if(isset($message)){
                $message = $message->getAsArray();
                $channel_id = $message["channel_id"];
                $data = Array("type" => "Channel", "object_id" => $channel_id);
                if (!$this->has_access($current_user_id, $data)) {
                    return false;
                }
            }
            else{
                return false;
            }
        }

        else if($type == "DriveFile"){ //pensez au parent id tous ca tous ca et a detached

            if ($id == "root" || $id == "trash") {
                if (!$data["workspace_id"]) {
                    return false;
                }
                return $this->has_access($current_user_id, Array("type" => "Workspace", "object_id" => $data["workspace_id"]));
            }

            if (!$id) {
                return false;
            }
            $df = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $id));

            if(isset($df)){
                $df = $df->getAsArray();
                $workspace_id = $df["workspace_id"];

                // Public access token
                if (isset($df["acces_info"]["token"]) && isset($options["token"]) && $df["acces_info"]["token"] != $options["token"]) {
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

        }

        else if($type == "Calendar"){ //pensez au parent id tous ca tous ca et a detached
            $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->findOneBy(Array("id" => $id));
            if(isset($calendar)){
                $calendar = $calendar->getAsArray();
                $workspace_id = $calendar["workspace_id"];
                if( !$this->user_has_workspace_access($current_user_id,$workspace_id) ){
                    return false;
                }
            }
            else{
                return false;
            }
        }


        return true;
    }

    public function user_has_workspace_access($current_user_id,$workspace_id){
        $wp = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace_id));
        $members = $wp->getMembers();
        $access = false;
        foreach ($members as $member){
            if($member->getUser()->getId() == $current_user_id){
                $access = true;
            }
        }
        if(!$access){
            return false;
        }

        return true;

    }

}
