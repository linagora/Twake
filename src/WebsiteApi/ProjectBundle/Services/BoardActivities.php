<?php

namespace WebsiteApi\ProjectBundle\Services;

use WebsiteApi\ProjectBundle\Entity\BoardActivity;
use WebsiteApi\ProjectBundle\Model\BoardActivityInterface;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\NotificationsBundle\Services\Notifications;


/**
 * Created by PhpStorm.
 * User: laura
 * Date: 25/06/18
 * Time: 09:25
 */

/**
 * Class BoardActivity
 * @package WebsiteApi\ProjectBundle\Services
 */
class BoardActivities implements BoardActivityInterface
{

    var $doctrine;
    /* @var Notifications $notifService */
    var $notifService;

    public function __construct($doctrine, $pusher, $notifService)
    {
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->notifService = $notifService;
    }

    public function pushActivity($pushNotif = true, $workspace, $user = null, $levels = null, $title="", $text = null, $type = Array(), $additionalData = Array())
    {
        //ajotuer dans la table BoardActivity
        if ($workspace != null) {
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace);
        }
        $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array('publicKey' => 'board'));
        // $application = $this->getDoctrine()->getManager()->getRepository("TwakeMarketBundle:Application")->findOneBy(Array('publicKey' => 'board'));

        $boardActivity = new BoardActivity($application, $workspace, $user);

        $data = Array(
            "type" => "add",
            "workspace_id" => ($workspace != null ? $workspace->getId() : null),
            "app_id" => ($application != null ? $application->getId() : null),
            "title" => $title,
            "text" => $text,
            "data" => $additionalData
        );

        if ($data) {
            $boardActivity->setData($data);
        }

        if ($text) {
            $boardActivity->setText($text);
        }
        $boardActivity->setTitle($title);


        $this->doctrine->persist($boardActivity);

        $data = Array("action" => "addActivity");
        $this->pusher->push($data, "board/workspace/" . $workspace->getId());

        //$data = Array("action" => "add");
        //$this->pusher->push($data, "boardActivity/workspace/".$workspace->getId());

        //appel pour faire une notification
        if ($pushNotif) {
            $this->notifService->pushNotification($application, $workspace, Array($user), $levels, "boardActivity", $text, $type, $additionalData, true);
            $this->pusher->push($boardActivity->getAsArray(), "board/activity");
        }

    }


    public function createBoardActivity($application, $workspaceId, $user)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));


        if ($workspace == null) {
            return false;
        } else {


            $boardActivity = new BoardActivity($application, $workspace, $user);
            $this->doctrine->persist($boardActivity);

            $this->doctrine->flush();

            $data = Array(
                "type" => "create",
                "boardActivity" => $boardActivity->getAsArray()
            );
            $this->pusher->push($data, "boardActivity/workspace/" . $workspaceId);

            return $boardActivity;
        }
    }

    public function readAll($workspace, $user)
    {

        $nRepo = $this->doctrine->getRepository("TwakeProjectBundle:BoardActivity");

        $search = Array(
            "user" => $user
        );

        if ($workspace) {
            $search["workspace"] = $workspace;
        }

        $notif = $nRepo->findBy($search);


        foreach ($notif as $not) {
            $not->setRead(1);
            $this->doctrine->persist($not);

        }
        $this->doctrine->flush();


    }

    public function readOne($workspace, $activityId){
        $repo = $this->doctrine->getRepository("TwakeProjectBundle:BoardActivity");
        $search = Array( "id" => $activityId);

        if ($workspace) {
            $search["workspace"] = $workspace;
        }

        $notif = $repo->findOneBy($search);


        $notif->setRead(1);
        $this->doctrine->persist($notif);

        $this->doctrine->flush();

    }
    public function removeAll($application, $workspace, $user, $code = null, $force = false)
    {

        $nRepo = $this->doctrine->getRepository("TwakeProjectBundle:BoardActivity");

        $search = Array(
            "user" => $user
        );

        if ($code) {
            $search["code"] = $code;
        }

        if ($application) {
            $search["application"] = $application;
        }

        if ($workspace) {
            $search["workspace"] = $workspace;
        }

        $notif = $nRepo->findBy($search);

        $count = count($notif);
        for ($i = 0; $i < $count; $i++) {
            $this->doctrine->remove($notif[$i]);
        }

        if ($count == 0) {
            return false;
        }

        if ($count > 0 || $force) {
            $this->doctrine->flush();

            $totalNotifications = $this->countAll($user);

            $data = Array(
                "action" => "remove",
                "workspace_id" => ($workspace) ? $workspace->getId() : null,
                "app_id" => ($application) ? $application->getId() : null
            );
            $this->pusher->push($data, "boardActivity/workspace/" . $workspace->getId());

            $this->updateDeviceBadge($user, $totalNotifications);
            return true;
        }
        return true;


    }

    public function getAll($user)
    {
        $nRepo = $this->doctrine->getRepository("TwakeProjectBundle:BoardActivity");
        $acti = $nRepo->findBy(Array("user" => $user), Array("id" => "DESC"), 30); //Limit number of results

        return $acti;
    }

    public function getActivityToDisplay($user, $workspace, $offset, $limit){
        $nRepo = $this->doctrine->getRepository("TwakeProjectBundle:BoardActivity");
        $acti = $nRepo->findBy(Array("user"=> $user, "workspace" => $workspace), Array("id" => "DESC"),$limit,$offset);
        $data = Array();
        foreach($acti as $a){

            array_push($data, $a->getAsArray());
        }

        return $data;

    }
}