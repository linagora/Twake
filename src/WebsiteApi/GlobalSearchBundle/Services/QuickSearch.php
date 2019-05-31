<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

class QuickSearch
{
    private $doctrine;
    private $userservice;
    private $workspaceservice;
    private $channelservice;
    private $fileservice;
    private $globalresult;

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
                $this->globalresult[] = Array("type" => "channel", "channel" => $channel, "workspace" => $workspace);
            }
        }

    }

    public function AddAllChannels($workspace){

        $channels= $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array("direct"=>false, "original_workspace_id" => $workspace["id"]));
        foreach ($channels as $channel){
            if($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false)
            {
                $channel = $channel->getAsArray();
                $this->globalresult[] = Array("type" => "channel", "channel" => $channel, "workspace" => $workspace);
            }
        }

    }

    public function SearchFile($words,$workspace){
        //var_dump($workspace["id"]);
        $files = $this->fileservice->search($words,$workspace);
        foreach ($files as $file){
            //var_dump($file);
            $this->globalresult[] = Array("type" => "file", "file" => $file, "workspace" => $workspace);

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

    public function QuickSearch($current_user_id,$group_id,$words){

        //$words = Array("appli","données","Thomas","Général","Space");
        //$words = Array("Général","Space","tranger","vrai","appli", "données", "Thomas");
        //$words = Array("pdf");
        $this->globalresult = Array();
//        var_dump($current_user_id);
//        var_dump($group_id);

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


        //var_dump($this->globalresult);


//        $workspaces = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findBy(Array());
//        foreach ($workspaces as $workspace) {
//            $this->doctrine->es_put($workspace, $workspace->getEsType());
//            /*var_dump($workspace->getAsArray()["name"]);
//            var_dump($workspace->getAsArray()["id"]);
//            var_dump($workspace->getAsArray()["group"]["id"]);*/
//
//        }
//
//        $channels = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
//        foreach ($channels as $channel) {
//            if ($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false) {
//                //var_dump($channel->getOriginalGroup()->getId()."");
//                //var_dump($channel->getAsArray());
//                $this->doctrine->es_put($channel, $channel->getEsType());
//            }
//        }

//        $files = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array());
//        foreach ($files as $file){
//                $this->doctrine->es_put($file,$file->getEsType());
//        }

        return $this->globalresult;
    }

}