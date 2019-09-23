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
//        foreach ($workspaces as $workspace) {
//            $this->doctrine->es_put($workspace, $workspace->getEsType());
//        }
//
//        $apps = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findBy(Array());
//        foreach ($apps as $app) {
//            $this->doctrine->es_put($app, $app->getEsType());
//        }
//
//        $files = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array());
//        foreach ($files as $file){
//            $this->doctrine->es_put($file, $file->getEsType());
//        }

        $groups = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group")->findBy(Array());
        foreach ($groups as $group){
            $this->doctrine->es_put($group, $group->getEsType());
        }

        $workspaces = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspaces")->findBy(Array());
        foreach ($workspaces as $workspace){
            $this->doctrine->es_put($workspace, $workspace->getEsType());
        }

        $mails = $this->doctrine->getRepository("TwakeUsersBundle:Mail")->findBy(Array());
        foreach ($mails as $mail){
            $this->doctrine->es_put($mail, $mail->getEsType());
        }

//        $channels= $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
//        foreach ($channels as $channel){
//            if($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false)
//            {
//                $this->doctrine->es_put($channel,$channel->getEsType());
//            }
//        }

    }

}