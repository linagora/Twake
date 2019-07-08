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

        $type = $data["type"];
        $id = $data["object_id"];


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
                if(!$this->has_access($current_user_id,$data)){
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
                if(!$detached && !(in_array($workpace_id,$workspaces)) ){
                    return false;
                }
                elseif($detached && !(in_array($workpace_id,$workspaces)) ){
                    //comment avoir l'acces à un fichier detached?
                    return false;
                }
                if($shared && isset($options["token"])){
                    $token = $options["token"];
                    $members = $df["public_acces_info"]["authorized_members"];
                    $channels = $df["public_acces_info"]["authorized_channels"];

                    if(!isset($members) && !isset($channels)) {
                        // si les deux liste sont vide alors l'utilisateur ne peux pas avoir acces au fichier
                        return false;
                    }

                    if($members != Array() && !in_array($current_user_id,$members) && $channels == Array()){
                    //fichier privé a certains et user pas dedans;
                    return false;
                    }
                    elseif( $channels != Array() && $members == Array()){
                        // il y a des channels en privé , on regarde si user et sur au moins un d'eux
                        $access = false;
                        foreach ($channels as $channel){
                            $data = Array("type" => "Channel", "object_id" => $channel);
                            if($this->has_access($current_user_id,$data)){
                                $access = true;
                            }
                        }
                        if(!$access){
                            return false;
                        }
                    }
                    if( $token != $df["public_acces_info"]["token"] ){
                        return false;
                    }
                }
                elseif($shared && !isset($options["token"])){
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

    public function give_file_public_access($file_id, $is_editable = false, $authorized_members = Array(), $authorized_channels = Array()){

//        error_log(print_r($is_editable, true));
//        error_log(print_r($authorized_members, true));
//        error_log(print_r($authorized_channels, true));


        $df = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $file_id));
        $shared = $df->getShared();
        $publicaccess = $df->getPublicAccesInfo();
        if(isset($shared)) {
            //on cree la liste des personnes autorizé;
            $df->setShared(true);
            $token = sha1(bin2hex(random_bytes(20)));;
            $jsondata = Array(
                "token" => $token,
                "authorized_members" => $authorized_members,
                "authorized_channels" => $authorized_channels,
                "is_editable" => $is_editable);
            $df->setPublicAccesInfo($jsondata);
            $this->doctrine->persist($df);
            $this->doctrine->flush();
        }

    }


}
