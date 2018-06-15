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


    public function newUser($name){
        $userToken = $this->get("app.user")->subscribeMail($name."@PHPUNIT.fr");
        $user = $this->get("app.user")->subscribe($userToken,null, $name,$name,true);

        if (!$user) {
            return $this->getDoctrine()->getRepository("TwakeUsersBundle:User")->findOneBy(Array("username" => $name));
        }

        $this->getDoctrine()->persist($user);
        $this->getDoctrine()->flush();

        return $user;
    }

    public function newUserByName($name){
        $userToken = $this->get("app.user")->subscribeMail($name . "@PHPUNIT.fr");
        $user = $this->get("app.user")->subscribe($userToken,null, $name,$name,true);

        if (!$user) {
            return $this->getDoctrine()->getRepository("TwakeUsersBundle:User")->findOneBy(Array("username" => $name));
        }

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
        $userRepository = $this->getDoctrine()->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->findByName("phpunit");
        if (count($user) == 0) {
            $user = $this->newUser();
        }
        $user = $user[0];
        $userId = $user->getId();
        $work = $this->get("app.workspaces")->create("phpunit", $groupId, $userId); // Get a service and run function
        $this->getDoctrine()->persist($work);
        $this->getDoctrine()->flush();

        return $work;
    }

    public function newSubscription($group,$pricing_plan, $balanceInit, $start_date, $end_date, $autowithdraw, $autorenew){

        $sub = $this->get("app.subscriptionSystem")->create($group,$pricing_plan,$balanceInit,$start_date,$end_date ,$autowithdraw,$autorenew);

        $this->getDoctrine()->persist($sub);
        $this->getDoctrine()->flush();

        return $sub;
    }


}
