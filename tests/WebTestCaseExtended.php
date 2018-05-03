<?php

namespace Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class WebTestCaseExtended extends WebTestCase
{

    var $client;

    protected function getDoctrine()
    {
        if (!isset($this->client)) {
            $this->client = static::createClient();
        }
        return $this->client->getContainer()->get('doctrine.orm.entity_manager');
    }

    protected function get($service)
    {
        if (!isset($this->client)) {
            $this->client = static::createClient();
        }
        return $this->client->getContainer()->get($service);
    }


    public function newUser(){
        $userToken = $this->get("app.user")->subscribeMail("PHPUNIT@PHPUNIT.fr");
        $user = $this->get("app.user")->subscribe($userToken,null, "phpunit","phpunit",true);

        $this->getDoctrine()->persist($user);
        $this->getDoctrine()->flush();

        return $user;
    }

    public function newUserByName($name){
        $userToken = $this->get("app.user")->subscribeMail($name . "@PHPUNIT.fr");
        $user = $this->get("app.user")->subscribe($userToken,null, $name,$name,true);

        $this->getDoctrine()->persist($user);
        $this->getDoctrine()->flush();

        return $user;
    }

    public function newGroup($userId){
        $group = $this->get("app.groups")->create($userId,"phpunit","phpunit",1);
        $this->getDoctrine()->persist($group);
        $this->getDoctrine()->flush();

        return $group;
    }

    public function newWorkspace($groupId){
        $work = $this->get("app.workspaces")->create("phpunit",$groupId); // Get a service and run function
        $this->getDoctrine()->persist($work);
        $this->getDoctrine()->flush();

        return $work;
    }

    public function destroyTestData(){
        $userRepository = $this->getDoctrine()->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->findByName("phpunit");

        $groupRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->findOneBy(Array("name" => "phpunit"));

        if ($group != null){
            $groupappsRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupApp");
            $groupapps = $groupappsRepository->findBy(Array("group" => $group));

            $workspaceRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->findOneBy(Array("name" => "phpunit"));

            $workspaceUserRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
            $workspaceUsers = $workspaceUserRepository->findBy(Array("workspace" => $workspace));

            $workspaceappsRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
            $workspaceapps = $workspaceappsRepository->findBy(Array("workspace" => $workspace));

            $workspacelevelRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
            $workspacelevels = $workspacelevelRepository->findBy(Array("workspace" => $workspace));

            $workspacestatsRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceStats");
            $workspacestats = $workspacestatsRepository->findOneBy(Array("workspace" => $workspace));

            $streamRepository = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Stream");
            $streams = $streamRepository->findBy(Array("workspace" => $workspace));

            $groupUserdRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupUser");
            $groupUsers = $groupUserdRepository->findBy(Array("group" => $group));

            $groupPeriodRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupPeriod");
            $groupPeriod = $groupPeriodRepository->findOneBy(Array("group" => $group));

            $groupPricingRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupPricingInstance");
            $groupPricing = $groupPricingRepository->findBy(Array("group" => $group));

            $archivedGroupPeriodRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:ArchivedGroupPeriod");
            $archivedGroupPeriods = $archivedGroupPeriodRepository->findBy(Array("group" => $group));
        }

        $PricingRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:PricingPlan");
        $pricing = $PricingRepository->findOneBy(Array("label" => "phpunit"));

        if($pricing != null){
            $this->getDoctrine()->remove($pricing);
        }
        if($user != null){
            if(is_array($user)){
                foreach($user as $u){
                    $this->getDoctrine()->remove($u);
                }
            }else{
                $this->getDoctrine()->remove($user);
            }
        }
        if ($group != null){
            if ($groupapps != null ){
                if (is_array($groupapps)){
                    foreach($groupapps as $groupapp){
                        $this->getDoctrine()->remove($groupapp);
                    }
                }
            }
            if ($workspaceapps != null ) {
                if (is_array($workspaceapps)) {
                    foreach ($workspaceapps as $workspaceapp) {
                        $this->getDoctrine()->remove($workspaceapp);
                    }
                }
            }
            if ($workspaceUsers != null ) {
                if (is_array($workspaceUsers)) {
                    foreach ($workspaceUsers as $workspaceUser) {
                        $this->getDoctrine()->remove($workspaceUser);
                    }
                }
            }
            if ($archivedGroupPeriods != null ) {
                if (is_array($archivedGroupPeriods)) {
                    foreach ($archivedGroupPeriods as $archivedGroupPeriod) {
                        $this->getDoctrine()->remove($archivedGroupPeriod);
                    }
                }
            }
            if ($workspacelevels != null ) {
                if (is_array($workspacelevels)) {
                    foreach ($workspacelevels as $workspacelevel) {
                        $this->getDoctrine()->remove($workspacelevel);
                    }
                }
            }
            if ($streams != null ) {
                if (is_array($streams)) {
                    foreach ($streams as $stream) {
                        $this->getDoctrine()->remove($stream);
                    }
                }
            }
            if($workspacestats != null){
                $this->getDoctrine()->remove($workspacestats);
            }
            if($workspace != null){
                $this->getDoctrine()->remove($workspace);
            }
            if (is_array($groupUsers)){
                foreach($groupUsers as $groupUser){
                    $this->getDoctrine()->remove($groupUser);
                }
            }
            if($groupPeriod != null){
                $this->getDoctrine()->remove($groupPeriod);
            }
            if (is_array($groupPricing)){
                foreach($groupPricing as $groupP){
                    $this->getDoctrine()->remove($groupP);
                }
            }
        }

        if($group != null){
            $this->getDoctrine()->remove($group);
        }

        $this->getDoctrine()->flush();
    }


}
