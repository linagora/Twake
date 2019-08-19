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


        $workspaces = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findBy(Array());
        //var_dump(sizeof($workspaces));
        foreach ($workspaces as $workspace) {
            //var_dump($workspace->getMembers()->getAsArray());
            $this->doctrine->es_put($workspace, $workspace->getEsType());
        }

        $apps = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findBy(Array());
        foreach ($apps as $app) {
            $this->doctrine->es_put($app, $app->getEsType());
        }

        $files = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array());
        foreach ($files as $file){
            $this->doctrine->es_put($file, $file->getEsType());
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