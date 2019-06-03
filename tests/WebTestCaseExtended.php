<?php

namespace Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class WebTestCaseExtended extends WebTestCase
{

    var $client;
    var $cookies = "";
    var $server = "";

    protected function getClient()
    {
        if (!isset($this->client)) {
            $this->client = static::createClient();
        }
        $this->server = "https://albatros.twakeapp.com";
        return $this->client;
    }

    public function resetCookies()
    {
        $this->cookies = "";
    }

    public function post($route, $data)
    {
        $cookies = $this->cookies;
        $res = $this->getClient()->getContainer()->get('circle.restclient')->post($this->server . $route, json_encode($data), Array(
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Cookie: ' . $cookies]
        ));
        if (isset($res->headers->all()["set-cookie"])) {
            $this->cookies = join(";", $res->headers->all()["set-cookie"]);
        }
        return $res;
    }

    public function get($route)
    {
        $res = $this->getClient()->getContainer()->get('circle.restclient')->get($this->server . $route);
        if (isset($res->headers->all()["set-cookie"])) {
            $this->cookies = join(";", $res->headers->all()["set-cookie"]);
        }
        return $res;
    }

    /*

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

    protected function getClient()
    {
        if (!isset($this->client)) {
            $this->client = static::createClient();
        }
        return $this->client;
    }

    protected function doPost($route, $data = Array())
    {
        return $this->call($route, $data, "POST");
    }

    protected function doGet($route)
    {
        return $this->call($route, Array(), "GET");
    }

    protected function call($route, $data = Array(), $method = "GET")
    {
        error_log(json_encode($data));
        $request = $this->getClient()->getContainer()->get('circle.restclient')->post($route, json_encode($data), Array(CURLOPT_HTTPHEADER=>Array("Content-Type": "application/json")));
        return json_decode($request->getContent(), 1);
    }

    public function newUser(){
        $userToken = $this->get("app.user")->subscribeMail("phpunit@PHPUNIT.fr");
        $user = $this->get("app.user")->subscribe($userToken,null, "phpunit","phpunit",true);

        if (!$user) {
            return $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("username" => "phpunit"));
        }

        $this->get("app.twake_doctrine")->persist($user);
        $this->get("app.twake_doctrine")->flush();

        return $user;
    }

    public function newUserByName($name){
        $userToken = $this->get("app.user")->subscribeMail($name . "@PHPUNIT.fr");
        $user = $this->get("app.user")->subscribe($userToken,null, $name,$name,true);

        if (!$user) {
            return $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("username" => $name));
        }

        $this->get("app.twake_doctrine")->persist($user);
        $this->get("app.twake_doctrine")->flush();

        return $user;
    }

    public function newGroup($userId){
        $group = $this->get("app.groups")->create($userId,"phpunit","phpunit",1);
        $this->get("app.twake_doctrine")->persist($group);
        $this->get("app.twake_doctrine")->flush();

        $groupIdentity = $this->get("app.group_identitys")->create($group, "fake","fake","fake",0);
        $this->get("app.twake_doctrine")->persist($groupIdentity);
        $this->get("app.twake_doctrine")->flush();

        return $group;
    }

    public function newWorkspace($groupId){
        $userRepository = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User");
       // $user = $userRepository->findByName("phpunit");
        $user = $userRepository->findOneBy(Array("usernamecanonical" => "phpunit"));
        if (count($user) == 0) {
            $user = $this->newUser();
        }
        //$user = $user[0];

        $userId = $user->getId(); //TODO
        $work = $this->get("app.workspaces")->create("phpunit", $groupId, $userId); // Get a service and run function
        $this->get("app.twake_doctrine")->persist($work);
        $this->get("app.twake_doctrine")->flush();

        return $work;
    }

    public function newSubscription($group,$pricing_plan, $balanceInit, $start_date, $end_date, $autowithdraw, $autorenew){

        $sub = $this->get("app.subscription_system")->create($group,$pricing_plan,$balanceInit,$start_date,$end_date ,$autowithdraw,$autorenew);

        return $sub;
    }
    */

}
