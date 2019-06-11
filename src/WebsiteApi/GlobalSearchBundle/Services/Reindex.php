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

//        $members = Array("d8a1136c-544e-11e9-9f85-0242ac120005");
//
//        $group = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group")->findOneBy(Array("id" => "480f11b4-4747-11e9-aa8e-0242ac120005"));
//        //var_dump($group->getAsArray());
//        $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => "d8a1136c-544e-11e9-9f85-0242ac120005"));
//        //var_dump($user->getAsArray());
//
//        $workspace1 = new Workspace("Général");
//        $workspace1->setGroup($group);
//        $workspace1->setId("14005200-48b1-11e9-a0b4-0242ac120005");
//        $this->doctrine->persist($workspace1);
//        $workspace_user = new WorkspaceUser($workspace1,$user,"d8a1136c-544e-11e9-9f85-0242ac120005");
//        $this->doctrine->persist($workspace_user);
//        //$workspace1->addMembers($workspace_user);
//        $this->doctrine->persist($workspace1);
//        //var_dump($workspace1->getAsArray());
//        $this->doctrine->flush();
//
//        $workspace1 = new Workspace("Les vrais");
//        $workspace1->setGroup($group);
//        $workspace1->setId("d975075e-6028-11e9-b206-0242ac120005");
//        $workspace1->setMembers($members);
//        $this->doctrine->persist($workspace1);
//        $this->doctrine->flush($workspace1);
//
//        $workspace1 = new Workspace("Test");
//        $workspace1->setGroup($group);
//        $workspace1->setId("6a0973b2-5634-11e9-8241-0242ac120005");
//        $workspace1->setMembers($members);
//        $this->doctrine->persist($workspace1);
//        $this->doctrine->flush($workspace1);
//
//        $workspace1 = new Workspace("Random");
//        $workspace1->setGroup($group);
//        $workspace1->setId("e8f3f6c0-4fd6-11e9-8ce7-0242ac120005");
//        $workspace1->setMembers($members);
//        $this->doctrine->persist($workspace1);
//        $this->doctrine->flush($workspace1);

//        $channels = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
//        foreach ($channels as $channel) {
//            if ($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false) {
//                var_dump($channel->getAsArray());
//            }
//        }

//        $workspaces = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findBy(Array());
//        var_dump(sizeof($workspaces));
//        foreach ($workspaces as $workspace) {
//            var_dump($workspace->getMembers()->getAsArray());
//            //$this->doctrine->es_put($workspace,$workspace->getEsType());
//        }
//        $channels= $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
//        foreach ($channels as $channel){
//            //if($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false)
//           // {
//                //var_dump(gettype($channel->getAsArray()["last_activity"]));
//                $this->doctrine->es_put($channel,$channel->getEsType());
//            //}
//        }

        $files = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array());
        foreach ($files as $file){
            var_dump($file->getAsArray());
                //$this->doctrine->es_put($file,$file->getEsType());
        }

//        $channels = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array());
//        foreach ($channels as $channel) {
//            if ($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == true) {
//                //if(in_array($current_user_id,$channel->getAsArray()["members"])){
//                    $futurname="";
//                    //var_dump($channel->getIndexationarray());
//                    //var_dump($channel->getAsArray()["members"]);
//                    foreach ($channel->getAsArray()["members"] as $member){
//                        $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $member));
//                        $futurname = $futurname . $user->getUsername() . "_";
//                    }
//                    $futurname = substr($futurname, 0, -1);
//                    $channel->setName($futurname);
//                    $this->doctrine->persist($channel);
//                    //var_dump($channel->getAsArray());
//                //}
//            }
//            $this->doctrine->flush();
//        }


    }

}