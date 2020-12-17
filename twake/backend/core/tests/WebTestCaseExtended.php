<?php

namespace Tests;

use App\App;
use Common\Http\Request;
use Twake\Workspaces\Entity\Group;
use Twake\Workspaces\Entity\Workspace;
use Twake\Channels\Entity\Channel;
use Twake\Channels\Entity\ChannelMember;
use Twake\Users\Entity\User;
use Twake\Workspaces\Entity\WorkspaceUser;
use Twake\Workspaces\Entity\WorkspaceLevel;

class WebTestCaseExtended extends \PHPUnit\Framework\TestCase
{

    var $client;

    /** @var App */
    public $app;

    public $cookies = [];


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

    protected function clearApp()
    {
        $this->app = null;
    }

    protected function clearClient()
    {
        $this->cookies = [];
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
        $this->clearApp();
        $request = new Request();
        $query_data = $this->getQueryFromUrl($route);
        $request->cookies->reset($this->cookies);
        $request->request->reset($data);
        $request->query->reset($query_data["query"]);
        $response = $this->getClient()->getRouting()->execute("post", $query_data["route"], $request);
        $this->cookies = array_merge($this->cookies, $response->getCookiesValues());
        return json_decode($response->getContent(), 1);
    }

    protected function doGet($route)
    {
        $this->clearApp();
        $request = new Request();
        $request->cookies->reset($this->cookies);
        $query_data = $this->getQueryFromUrl($route);
        $request->query->reset($query_data["query"]);
        $response = $this->getClient()->getRouting()->execute("get", $query_data["route"], $request);
        $this->cookies = array_merge($this->cookies, $response->getCookiesValues());
        return json_decode($response->getContent(), 1);
    }

    private function getQueryFromUrl($route)
    {
        $route = explode("?", $route);
        if (count($route) == 1) {
            return ["route" => $route[0], "query" => []];
        }
        $parts = $route[1];
        parse_str($parts, $query);

        return ["route" => $route[0], "query" => $query];
    }


    public function newUserByName($name, $mail = null)
    {

        $user = $this->get("app.twake_doctrine")->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => $name));

        if ($user) {
            $this->removeUserByName($name);
        }

        if (!$mail) {
            $mail = $name . "@twake_phpunit.fr";
        }

        $userWithMail = $this->get("app.twake_doctrine")->getRepository("Twake\Users:User")->findOneBy(Array("emailcanonical" => $mail));
        if ($userWithMail) {
            $this->removeUserByName($userWithMail->getUsername());
        }

        $mails = $this->get("app.twake_doctrine")->getRepository("Twake\Users:Mail")->findBy(Array("mail" => $mail));
        foreach ($mails as $mail) {
            $this->get("app.twake_doctrine")->remove($mail);
            $this->get("app.twake_doctrine")->flush();
        }
        $token = $this->get("app.user")->subscribeMail($mail, $name, $name, "", "", "", "en", false);
        $this->get("app.user")->verifyMail($mail, $token, "", true);

        $user = $this->get("app.twake_doctrine")->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => $name));

        return $user;
    }

    public function removeUserByName($name)
    {
        $user = $this->get("app.twake_doctrine")->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => $name));

        if (isset($user)) {

            $mails = $this->get("app.twake_doctrine")->getRepository("Twake\Users:Mail")->findBy(Array("user_id" => $user));

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
        $channel->setOriginalGroupId($group->getId());

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
        return $result;
    }

    public function logout()
    {
        $this->clearClient();
        $this->doPost("/ajax/users/logout", Array());
    }
}
