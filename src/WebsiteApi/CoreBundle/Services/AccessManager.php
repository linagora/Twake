<?php

namespace WebsiteApi\CoreBundle\Services;

class AccessManager
{

    public function __construct($doctrine, $memberservice)
    {
        $this->doctrine = $doctrine;
        $this->memberservice = $memberservice;
    }

    public function has_acces($current_user_id, $data){

        $type = $data["type"];
        $id = $data["object_id"];

//        error_log(print_r($type,true));
//        error_log(print_r($id,true));
//        error_log(print_r($current_user_id,true));


        //FONCTION POUR SAVOIR SI UN UTILISATEUR A ACCES A QUELQUE CHOSE


        $workspaces_acces = $this->memberservice->getWorkspaces($current_user_id);
        $workspaces = Array(); //liste des workspace dont on a accces;
        foreach ($workspaces_acces as $workspace_obj){
            $value = $workspace_obj["workspace"]->getAsArray();
            $workspaces[$value["id"]] = $value["id"];
        }



        if($type == "Workspace"){
            if(!(in_array($id,$workspaces))){
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
                if( (!in_array($workspace_id,$workspaces)) || ((!in_array($current_user_id,$members)) && (!in_array($current_user_id,$ext_members)))  )
                {
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
                if(!$this->has_acces($current_user_id,$data)){
                    return false;
                }
            }
            else{
                return false;
            }
        }

        else if($type == "DriveFile"){ //pensez au parent id tous ca tous ca et a detached
            $df = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $id));
            if(isset($df)){
                $df = $df->getAsArray();
                $detached = $df["detached"];
                $shared = $df["shared"];
                $workpace_id = $df["workspace_id"];
                if( !$shared && (!$detached && !(in_array($workpace_id,$workspaces))) ){
                    return false;
                }
                elseif( !$shared &&  ($detached && !(in_array($workpace_id,$workspaces)))){

                    return false;
                }
            }
            else{
                return false;
            }
        }

        else if($type == "Calendar"){ //pensez au parent id tous ca tous ca et a detached
            $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->findOneBy(Array("id" => $id));
            if(isset($calendar)){
                $calendar = $calendar->getAsArray();
                $workpace_id = $calendar["workspace_id"];
                if( !(in_array($workpace_id,$workspaces))){
                    return false;
                }
            }
            else{
                return false;
            }
        }


        return true;

    }

}
