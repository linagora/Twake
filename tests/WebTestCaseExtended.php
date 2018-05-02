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
        $user = $userRepository->findOneBy(Array("username" => "phpunit"));

        $groupRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->findOneBy(Array("name" => "phpunit"));

        $workspaceRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Workspace");
        $workspace = $workspaceRepository->findOneBy(Array("name" => "phpunit"));

        if($user != null){
            $this->getDoctrine()->remove($user);
        }
        if($group != null){
            $this->getDoctrine()->remove($group);
        }
        if($workspace != null){
            $this->getDoctrine()->remove($workspace);
        }
        $this->getDoctrine()->flush();
    }


}
