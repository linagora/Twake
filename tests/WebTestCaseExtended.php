<?php

namespace Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class WebTestCaseExtended extends WebTestCase
{

    var $client;

    /*    var $cookies = "";
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
        }*/

    public function __construst(){
      parent::__construct();
      error_reporting(E_ERROR | E_PARSE); // Rapporte les erreurs d'exécution de script
    }

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

    protected function clearClient(){
        $this->client = null;
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
        $this->getClient()->request($method, $route, array(), array(), array('CONTENT_TYPE' => 'application/json'),
            json_encode($data)
        );
        return $this->getClient()->getResponse();
    }

    public function newUserByName($name){

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => $name));

        if ($user) {
            $this->removeUserByName($name);
        }

        $mail = $name . "@twake_phpunit.fr";

        $userWithMail = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("emailcanonical" => $mail));
        if ($userWithMail) {
            error_log("Removed already existing user with mail " . $userWithMail);
            $this->removeUserByName($userWithMail->getUsername());
        }

        $mails = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:Mail")->findBy(Array("mail" => $mail));
        foreach ($mails as $mail) {
            $this->get("app.twake_doctrine")->remove($mail);
            $this->get("app.twake_doctrine")->flush();
        }

        $token = $this->get("app.user")->subscribeMail($mail, $name, $name, "", "", "", "en", false);
        $this->get("app.user")->verifyMail($mail, $token, "", true);

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => $name));

        if (!$user) {
            error_log("User " . $name . " not created");
        }

        return $user;
    }

    public function removeUserByName($name){
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => $name));

        if (isset($user)) {

            $mails = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:Mail")->findBy(Array("user" => $user));

            foreach ($mails as $mail) {
                $this->get("app.twake_doctrine")->remove($mail);
            }

            $this->get("app.twake_doctrine")->remove($user);
            $this->get("app.twake_doctrine")->flush();
        }
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


}
