<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\GlobalSearchBundle\Entity\Bloc;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\DriveBundle\Entity\DriveFile;


class Search
{
    private $doctrine;
    private $blocservice;
    private $fileservice;
    private $userservice;
    private $workspaceservice;
    private $channelservice;

    public function __construct($doctrine, $blocservice, $fileservice, $userservice, $workspaceservice, $channelservice)
    {
        $this->doctrine = $doctrine;
        $this->blocservice = $blocservice;
        $this->fileservice = $fileservice;
        $this->userservice = $userservice;
        $this->workspaceservice = $workspaceservice;
        $this->channelservice = $channelservice;
    }

    public function GlobalSearch(){

        $words = Array("appli","données","Thomas","General","Space");
        $globalresult = Array();

        $messages = $this->blocservice->search($words);
        foreach ($messages as $message){
            $globalresult[]=Array( $message["id"] => "message");
        }

        $files = $this->fileservice->search($words);
        foreach ($files as $file){
            $globalresult[]=Array( $file["id"] => "file");
        }

        $users = $this->userservice->search($words);
        foreach ($users as $user){
            $globalresult[]=Array( $user["id"] => "user");
        }

        $channels = $this->channelservice->search($words,"97772348-64ea-11e9-8c33-0242ac120004"); // search channel in a workspace
        foreach ($channels as $channel){
            $globalresult[]=Array( $channel["id"] => "channel");
        }

        $workspaces = $this->workspaceservice->search($words); // search channel in a workspace
        foreach ($workspaces as $workspace){
            $globalresult[]=Array( $workspace["id"] => "workspace");
        }

        var_dump($globalresult);

//        $workspaces = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findBy(Array());
//        foreach ($workspaces as $workspace) {
//            $this->doctrine->es_put($workspace,$workspace->getEsType());
//        }

//        $channels= $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
//        foreach ($channels as $channel){
//            if($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false)
//                var_dump($channel->getAsArray()["name"]);
//        }
    }

}