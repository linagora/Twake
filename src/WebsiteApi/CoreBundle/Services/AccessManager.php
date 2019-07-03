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


        //FONCTION POUR SAVOIR SI UN UTILISATEUR A ACCES A QUELQUE CHOSE

        var_dump($type);
        var_dump($id);


        $workspaces_acces = $this->memberservice->getWorkspaces($current_user_id);
        $workspaces = Array(); //liste des workspace dont on a accces;
        foreach ($workspaces_acces as $workspace_obj){
            $value = $workspace_obj["workspace"]->getAsArray();
            $workspaces[$value["id"]] = $value["id"];
            //var_dump($value);
        }

        if($type == "Workspace"){
            if(!(in_array($id,$workspaces))){
                return false;
            }
        }

        else if($type == "Channel"){
            $ch = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $id));
            if(isset($ch)){
               $ch = $ch->getAsArray();
               $workpace_id = $ch["workspace_id"];
               $members = $ch->getMembers();
               $ext_members = $ch->getExtMembers();
               if( (!in_array($workpace_id,$workspaces)) || ( (!isset($members) || !in_array($id,$members)) || (!isset($ext_members) || !in_array($id,$ext_members)) ) ){
                    return false;
               }
            }
            else{
                return false;
            }
        }

        else if($type == "Message"){
            $ms = $this->doctrine->getRepository("TwakeDiscussionBundleMessage")->findOneBy(Array("id" => $id));
            if(isset($ms)){
                $ms = $ms->getAsArray();
                $channel_id = $ms["channel_id"];
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
            var_dump("cc 3");
            $df = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $id));
            if(isset($df)){
                $df = $df->getAsArray();
                $workpace_id = $df["workspace_id"];
                if(!(in_array($id,$workspaces))){
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
