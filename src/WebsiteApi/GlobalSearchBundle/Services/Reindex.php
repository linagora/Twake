<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;

class Reindex
{
    private $doctrine;


    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;

    }

    public function Reindex(){


//        $workspaces = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findBy(Array());
//        var_dump(sizeof($workspaces));
//        foreach ($workspaces as $workspace) {
//            var_dump($workspace->getMembers()->getAsArray());
//            //$this->doctrine->es_put($workspace,$workspace->getEsType());
//        }

        $files = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array());
        foreach ($files as $file){
            $keywords = $file->getContentKeywords();
            if(isset($keywords)){ //mot clé existant
                if(isset($keywords[0]["word"]) && isset($keywords[0]["score"])){ //On e a le mauvais format
                    $newkeywords = Array();
                    foreach ($keywords as $keyword){
                        $newkeywords[] = Array( "keyword" => $keyword["word"], "score" => $keyword["score"]);
                    }
                    $file->setContentKeywords($newkeywords);
                }
            }
        }

        $files = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array());
        foreach ($files as $file){
            $keywords = $file->getContentKeywords();
            if(isset($keywords)){
                if(isset($keywords[0]["keyword"]) && isset($keywords[0]["score"])){
                    $this->doctrine->es_put($file,$file->getEsType());
                }
            }
        }

        $channels = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
        foreach ($channels as $channel) {
            if ($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == true) {
                    $futurname="";
                    //var_dump($channel->getIndexationarray());
                    //var_dump($channel->getAsArray()["members"]);
                    foreach ($channel->getAsArray()["members"] as $member){
                        $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $member));
                        $futurname = $futurname . $user->getUsername() . "_";
                    }
                    $futurname = substr($futurname, 0, -1);
                    $channel->setName($futurname);
                    $this->doctrine->persist($channel);
                    //var_dump($channel->getAsArray());
            }
            $this->doctrine->flush();
        }


        $channels= $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
        foreach ($channels as $channel){
            if($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false)
            {
                //var_dump(gettype($channel->getAsArray()["last_activity"]));
                $this->doctrine->es_put($channel,$channel->getEsType());
            }
        }

    }

}