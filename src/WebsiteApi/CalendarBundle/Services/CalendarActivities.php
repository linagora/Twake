<?php

namespace WebsiteApi\CalendarBundle\Services;

use WebsiteApi\CalendarBundle\Entity\CalendarActivity;
use WebsiteApi\CalendarBundle\Model\CalendarActivityInterface;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\NotificationsBundle\Services\Notifications;


/**
 * Created by PhpStorm.
 * User: laura
 * Date: 25/06/18
 * Time: 09:25
 */

/**
 * Class CalendarActivity
 * @package WebsiteApi\CalendarBundle\Services
 */
class CalendarActivities implements CalendarActivityInterface
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
        //ajotuer dans la table CalendarActivity
        if ($workspace != null) {
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace);
        }
        $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array('publicKey' => 'calendar'));
        // $application = $this->getDoctrine()->getManager()->getRepository("TwakeMarketBundle:Application")->findOneBy(Array('publicKey' => 'calendar'));

        $calendarActivity = new CalendarActivity($application, $workspace, $user);

        $data = Array(
            "type" => "add",
            "workspace_id" => ($workspace != null ? $workspace->getId() : null),
            "app_id" => ($application != null ? $application->getId() : null),
            "title" => $title,
            "text" => $text,
            "data" => $additionalData
        );

        if ($data) {
            $calendarActivity->setData($data);
        }

        if ($text) {
            $calendarActivity->setText($text);
        }
        $calendarActivity->setTitle($title);


        $this->doctrine->persist($calendarActivity);

        $data = Array("action" => "addActivity");
        $this->pusher->push($data, "calendar/workspace/" . $workspace->getId());

        //$data = Array("action" => "add");
        //$this->pusher->push($data, "calendarActivity/workspace/".$workspace->getId());

        //appel pour faire une notification
        if ($pushNotif) {
            $this->notifService->pushNotification($application, $workspace, Array($user), $levels, "calendarActivity", $text, $type, Array("data" => $additionalData), true);
            $this->pusher->push($calendarActivity->getAsArray(), "calendar/activity");
        }

    }


    public function createCalendarActivity($application, $workspaceId, $user)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));


        if ($workspace == null) {
            return false;
        } else {


            $calendarActivity = new CalendarActivity($application, $workspace, $user);
            $this->doctrine->persist($calendarActivity);

            $this->doctrine->flush();

            $data = Array(
                "type" => "create",
                "calendarActivity" => $calendarActivity->getAsArray()
            );
            $this->pusher->push($data, "calendarActivity/workspace/" . $workspaceId);

            return $calendarActivity;
        }
    }

    public function readAll($workspace, $user)
    {

        $nRepo = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarActivity");

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
        $repo = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarActivity");
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

        $nRepo = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarActivity");

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
            $this->pusher->push($data, "calendarActivity/workspace/" . $workspace->getId());

            $this->updateDeviceBadge($user, $totalNotifications);
            return true;
        }
        return true;


    }

    public function getAll($user)
    {
        $nRepo = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarActivity");
        $acti = $nRepo->findBy(Array("user" => $user), Array("id" => "DESC"), 30); //Limit number of results

        return $acti;
    }

    public function getActivityToDisplay($user, $workspace, $offset, $limit){
        $nRepo = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarActivity");
        $acti = $nRepo->findBy(Array("user"=> $user, "workspace" => $workspace), Array("id" => "DESC"),$limit,$offset);
        $data = Array();
        foreach($acti as $a){

            array_push($data, $a->getAsArray());
        }

        return $data;

    }
}