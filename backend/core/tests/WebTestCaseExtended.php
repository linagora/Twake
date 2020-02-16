<?php

namespace Tests;

use App\App;
use Common\Http\Request;
use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\ChannelsBundle\Entity\Channel;
use WebsiteApi\ChannelsBundle\Entity\ChannelMember;
use WebsiteApi\UsersBundle\Entity\User;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceLevel;

class WebTestCaseExtended extends \PHPUnit\Framework\TestCase
{

    var $client;

    /** @var App */
    public $app;


    public function __construct()
    {
        error_reporting(E_ERROR | E_PARSE);
        # Warning:
        \PHPUnit_Framework_Error_Warning::$enabled = FALSE;
        # notice, strict:
        \PHPUnit_Framework_Error_Notice::$enabled = FALSE;
        define("TESTENV", true);
    }

    protected function getDoctrine()
    {
        return $this->get("app.twake_doctrine");
    }

    protected function get($service)
    {
        return $this->getClient()->getServices()->get($service);
    }

    protected function clearClient()
    {
        $this->app = null;
    }

    protected function getClient(): App
    {
        if (!isset($this->app) || !$this->app) {
            $this->app = new App();
        }
        return $this->app;
    }

    protected function doPost($route, $data = Array())
    {
        $request = new Request();
        //TODO set content
        //TODO extract route GET parameters
        return $this->getClient()->getRouting()->execute("post", $route, $request);
    }

    protected function doGet($route)
    {
        $request = new Request();
        //TODO extract route GET parameters
        return $this->getClient()->getRouting()->execute("get", $route, $request);
    }


    public function newUserByName($name, $mail = null)
    {

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => $name));

        if ($user) {
            $this->removeUserByName($name);
        }

        if (!$mail) {
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

    public function removeUserByName($name)
    {
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

    public function newGroup($userId, $name)
    {
        $group = new Group($name);
        $this->get("app.twake_doctrine")->persist($group);
        $plan = $this->get("app.pricing_plan")->getMinimalPricing();
        $group->setPricingPlan($plan);
        $this->get("app.twake_doctrine")->flush();
        return $group;
    }

    public function newWorkspace($name, $group)
    {
        $work = new Workspace($name);
        $work->setGroup($group);
        $this->get("app.twake_doctrine")->persist($work);
        $this->get("app.twake_doctrine")->flush();

        return $work;
    }

    public function newChannel($group, $workspace, $user)
    {
        $channel = new Channel();
        $channel->setDirect(false);
        $channel->setOriginalWorkspaceId($workspace->getId());
        $channel->setOriginalGroup($group);

        $this->getDoctrine()->persist($channel);
        $this->getDoctrine()->flush();

        $linkUserChannel = new ChannelMember($user->getId() . "", $channel);
        $this->getDoctrine()->persist($linkUserChannel);
        $this->getDoctrine()->flush();
        return $channel;
    }

    public function newSubscription($group, $pricing_plan, $balanceInit, $start_date, $end_date, $autowithdraw, $autorenew)
    {

        $sub = $this->get("app.subscription_system")->create($group, $pricing_plan, $balanceInit, $start_date, $end_date, $autowithdraw, $autorenew);

        return $sub;
    }

    public function login($username, $password = null)
    {
        if (!$password) {
            $password = $username;
        }
        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => $username,
            "_password" => $password
        ));
    }

    public function logout()
    {
        $this->doPost("/ajax/users/logout", Array());
    }
}
