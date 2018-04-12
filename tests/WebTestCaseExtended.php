<?php

namespace Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class WebTestCaseExtended extends WebTestCase
{

    static $client;

    protected function getDoctrine()
    {
        if (!isset(WebTestCaseExtended::$client)) {
            WebTestCaseExtended::$client = static::createClient();
        }
        return WebTestCaseExtended::$client->getContainer()->get('doctrine.orm.entity_manager');
    }

    protected function get($service)
    {
        if (!isset(WebTestCaseExtended::$client)) {
            WebTestCaseExtended::$client = static::createClient();
        }
        return WebTestCaseExtended::$client->getContainer()->get($service);
    }


    public function newUser(){
        $userToken = $this->get("app.user")->subscribeMail("PHPUNIT@PHPUNIT.fr");
        $user = $this->get("app.user")->subscribe($userToken,null, "php unit","php unit",true);

        $this->getDoctrine()->persist($user);
        $this->getDoctrine()->flush();

        return $user;
    }

    public function newGroup($userId){
        $group = $this->get("app.groups")->create($userId,"mon groupe PHP UNIT","PHP UNIT",1);
        $this->getDoctrine()->persist($group);
        $this->getDoctrine()->flush();

        return $group;
    }

    public function newWorkspace($groupId){
        $work = $this->get("app.workspaces")->create("mon workspace PHPUNIT",$groupId); // Get a service and run function
        $this->getDoctrine()->persist($work);
        $this->getDoctrine()->flush();

        return $work;
    }


}
