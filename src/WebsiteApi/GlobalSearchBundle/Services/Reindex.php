<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

class Reindex
{
    private $doctrine;


    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;

    }

    public function Reindex(){

        $workspaces = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findBy(Array());
        foreach ($workspaces as $workspace) {
            $this->doctrine->es_put($workspace,$workspace->getEsType());
        }

        $channels= $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
        foreach ($channels as $channel){
            if($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false)
            {
                $this->doctrine->es_put($channel,$channel->getEsType());
            }
        }

        $files = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array());
        foreach ($files as $file){
                $this->doctrine->es_put($file,$file->getEsType());
        }

    }

}