<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\CoreBundle\Services\StringCleaner;

class QuickSearch
{
    private $doctrine;
    private $userservice;
    private $workspaceservice;
    private $channelservice;
    private $fileservice;

    //liste final de résultat
    private $globalresult;

    //va stocker les résultat non prioritaire séparé par type
    private $fileresult;
    private $channelresult;

    //va stocker les résultat prioritaire séparé par type
    private $priofileresult;
    private $prioresult;

    private $workspace_prio;

    public function __construct($doctrine, $userservice, $workspaceservice, $channelservice, $fileservice)
    {
        $this->doctrine = $doctrine;
        $this->userservice = $userservice;
        $this->workspaceservice = $workspaceservice;
        $this->channelservice = $channelservice;
        $this->fileservice = $fileservice;
    }

    public function SearchInWorkspace($words,$workspace,$group_id,$current_user_id)
    {
        $channels = $this->channelservice->search($words,$workspace["id"],$group_id); // search channel in a workspace
        foreach ($channels as $channel){
            if(in_array($current_user_id,$channel["members"]))
            {
                if(isset($this->workspace_prio) && $this->workspace_prio == $workspace["id"]){
                   $this->prioresult[] = Array("type" => "channel", "channel" => $channel, "workspace" => $workspace);
                }
                else {
                    $this->channelresult[] = Array("type" => "channel", "channel" => $channel, "workspace" => $workspace);
                }
            }
        }
    }

    public function AddAllChannels($workspace){

        $channels= $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array("direct"=>false, "original_workspace_id" => $workspace["id"]));
        foreach ($channels as $channel){
            if($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false)
            {
                $channel = $channel->getAsArray();
                if(isset($this->workspace_prio) && $this->workspace_prio == $workspace["id"]){
                    $this->prioresult[] = Array("type" => "channel", "channel" => $channel, "workspace" => $workspace);
                }
                else{
                    $this->channelresult[] = Array("type" => "channel", "channel" => $channel, "workspace" => $workspace);
                }
            }
        }

    }

    public function SearchFile($words,$workspace){
        //var_dump($workspace["id"]);
        $files = $this->fileservice->search($words,$workspace);
        foreach ($files as $file){
            if(isset($this->workspace_prio) && $this->workspace_prio == $workspace["id"]){
                $this->priofileresult[] = Array("type" => "file", "file" => $file[0], "score" => $file[1], "workspace" => $workspace);
            }
            else {
                $this->fileresult[] = Array("type" => "file", "file" => $file[0], "score" => $file[1], "workspace" => $workspace);
            }
        }
    }

    public function SearchDirect($current_user_id){
        $members = [];
        $channels= $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
        foreach ($channels as $channel){
            if($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == true)
            {
                //var_dump($channel->getOriginalGroup()->getId()."");
                if (in_array($current_user_id,$channel->getAsArray()["members"])){
                    $temp = $channel->getAsArray()["members"];
                    foreach ($temp as $direct){
                        if($direct != $current_user_id) {
                            $user_acces = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $direct));
                            $members[] = $user_acces->getAsArray()["username"];
                        }
                    }
                }
            }
        }
    }

    public function QuickSearch($current_user_id,$group_id,$words,$workspace_prio = null){

        //$words = Array("appli","données","Thomas","Général","Space");
        //$words = Array("Général","Space","tranger","vrai","appli", "données", "Thomas");
        $this->workspace_prio = $workspace_prio;
        $this->workspace_prio = "d975075e-6028-11e9-b206-0242ac120005";
        $words = Array("civ","Général");
        $st = new StringCleaner();
        $words = $st->simplifyInArray($words);
        $this->globalresult = Array();
        $this->fileresult = Array();
        $this->channelresult = Array();
        $this->prioresult = Array();

        // $users = $this->userservice->search($words);
        // foreach ($users as $user){
        //     $globalresult[]=Array( $user["id"] => "user");
        // }

         //$workspaces_search = $this->workspaceservice->search($words,$current_user_id,$group_id,true); // search workspace
         $workspaces = $this->workspaceservice->search($group_id);
        //var_dump($workspaces);
        foreach ($workspaces as $workspace){
             $workspace_user = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace["id"]));
             $temp = $workspace_user->getMembers();

            foreach ($temp as $member){
                 $user = $member->getUser();
                 if($user->getAsArray()["id"] == $current_user_id) // on a acces au wp
                 {
                     $match = false;
                     foreach($words as $word){
                         if ((strpos($workspace["name"], $word)) !== false){
                             $match = true;
                             $this->AddAllChannels($workspace);
                             break;
                         }
                     }
                     if(!$match)
                     {
                         $this->SearchInWorkspace($words, $workspace, $group_id, $current_user_id);
                     }
                     $this->SearchFile($words,$workspace);
                 }
             }
         }
        //$this->SearchDirect($current_user_id); A utiliser avec ES quand ca sera pris en compte pour soucis de perf
        usort($this->fileresult,function ($file1, $file2){ //permet d'obtenir la list des fichier par liste de pertinence

            if ($file1["score"] == $file2["score"]) {
                return 0;
            }
            return ($file1["score"] > $file2["score"]) ? -1 : 1;
        });

        usort($this->priofileresult,function ($file1, $file2){ //permet d'obtenir la list des fichier par liste de pertinence

            if ($file1["score"] == $file2["score"]) {
                return 0;
            }
            return ($file1["score"] > $file2["score"]) ? -1 : 1;
        });



//        une fois toutes les données récupéré on construit le tableau de résltat final comme suit:
//        - resultat prio
//        - fichier prio
//        - channel
//        - fichier

        $this->globalresult = array_merge($this->globalresult,$this->prioresult);
        $this->globalresult = array_merge($this->globalresult,$this->priofileresult);
        $this->globalresult = array_merge($this->globalresult,$this->channelresult);
        $this->globalresult = array_merge($this->globalresult,$this->fileresult);
        var_dump($this->globalresult);

//
//        $workspaces = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findBy(Array("id" => "0f34eff8-48af-11e9-9dd1-0242ac120005"));
//        foreach ($workspaces as $workspace) {
//            //var_dump($workspace->getAsArray());
//        }
//
//        $channels = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
//        foreach ($channels as $channel) {
//            if ($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false) {
//                //var_dump($channel->getAsArray());
//            }
//        }

//        $files = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array("id" => "e604bc08-805d-11e9-b018-0242ac130002"));
//        foreach ($files as $file){
//            //var_dump($file->getAsArray());
//        }

        //return $this->globalresult;
    }

}