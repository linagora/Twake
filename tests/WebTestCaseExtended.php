<?php

namespace Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;

class WebTestCaseExtended extends WebTestCase
{

    var $client;


    public function setUp(){
      # Warning:
      \PHPUnit_Framework_Error_Warning::$enabled = FALSE;
      # notice, strict:
      \PHPUnit_Framework_Error_Notice::$enabled = FALSE;
    }

    protected function getDoctrine()
    {
        if (!isset($this->client)) {
            $this->client = static::createClient();
        }
        return $this->get("app.twake_doctrine");
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
        //error_log("call for ".$route."--- with :".json_encode($data)."--- response : ".$this->getClient()->getResponse()->getContent());
        return json_decode($this->getClient()->getResponse()->getContent(),true);
    }

    public function newUserByName($name,$mail=null){

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => $name));

        if ($user) {
            $this->removeUserByName($name);
        }

        if(!$mail){
            $mail = $name . "@twake_phpunit.fr";
        }

        $userWithMail = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("emailcanonical" => $mail));
        if ($userWithMail) {
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

    public function newGroup($userId,$name){
        $grp = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Group")->findOneBy(Array("name"=>$name));
        if($grp){
            $this->getDoctrine()->remove($grp);
        }
        $group = new Group($name);
        $this->get("app.twake_doctrine")->persist($group);
        $plan = $this->get("app.pricing_plan")->getMinimalPricing();
        $group->setPricingPlan($plan);
        $this->get("app.twake_doctrine")->flush();
        return $group;
    }

    public function newWorkspace($name,$group){
        $wsp = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("name"=>$name));
        if($wsp){
            $this->getDoctrine()->remove($wsp);
        }
        $work = new Workspace($name);
        $work->setGroup($group);
        $this->get("app.twake_doctrine")->persist($work);
        $this->get("app.twake_doctrine")->flush();

        return $work;
    }

    public function newChannel($group,$workspace,$user){
        $channel = new Channel();
        $channel->setDirect(false);
        $channel->setOriginalWorkspaceId($workspace->getId());
        $channel->setOriginalGroup($group);

        $this->getDoctrine()->persist($channel);
        $this->getDoctrine()->flush();

        $linkUserChannel = new ChannelMember($user->getId()."",$channel);
        $this->getDoctrine()->persist($linkUserChannel);
        $this->getDoctrine()->flush();
        return $channel;
    }

    public function newSubscription($group,$pricing_plan, $balanceInit, $start_date, $end_date, $autowithdraw, $autorenew){

        $sub = $this->get("app.subscription_system")->create($group,$pricing_plan,$balanceInit,$start_date,$end_date ,$autowithdraw,$autorenew);

        return $sub;
    }

    public function login($username,$password=null){
        if(!$password){
            $password = $username;
        }
        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => $username,
            "_password" => $password
        ));
    }
    public function logout(){
        $this->doPost("/ajax/users/logout", Array());
    }
}
