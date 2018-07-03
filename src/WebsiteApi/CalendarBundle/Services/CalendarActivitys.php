<?php

namespace WebsiteApi\CalendarBundle\Services;

use WebsiteApi\CalendarBundle\Entity\CalendarActivity;
use WebsiteApi\CalendarBundle\Model\CalendarActivityInterface;
use WebsiteApi\MarketBundle\Entity\Application;


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
class CalendarActivitys implements CalendarActivityInterface
{

    var $doctrine;
    var $notifService;

    public function __construct($doctrine, $pusher, $notifService)
    {
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->notifService = $notifService;
    }

    public function pushTable($pushNotif = true, $workspace, $user = null, $levels = null, $texte = null, $type = Array())
    {
        //ajotuer dans la table CalendarActivity
        if ($workspace != null) {
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace);
        }
        $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array('publicKey' => 'calendar'));
        // $application = $this->getDoctrine()->getManager()->getRepository("TwakeMarketBundle:Application")->findOneBy(Array('publicKey' => 'calendar'));

        $cal = new CalendarActivity($application, $workspace, $user);

        $data = Array(
            "type" => "add",
            "workspace_id" => ($workspace != null ? $workspace->getId() : null),
            "app_id" => ($application != null ? $application->getId() : null),
            "title" => "",
            "text" => $texte
        );

        if ($data) {
            $cal->setData($data);
        }

        if ($texte) {
            $cal->setText($texte);
        }
        $cal->setTitle("");


        $this->doctrine->persist($cal);

        $data = Array("action" => "addActiviy");
        $this->pusher->push($data, "calendar/workspace/" . $workspace->getId());

        //$data = Array("action" => "add");
        //$this->pusher->push($data, "calendarActivity/workspace/".$workspace->getId());

        //appel pour faire une notification
        if ($pushNotif) {
            $this->notifService->pushNotification($application, $workspace, $user, $levels, "calendarActivity", $texte, $type, null, true);

        }

    }


    public function createCalendarActivity($application, $workspaceId, $user)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));


        if ($workspace == null) {
            return false;
        } else {


            $cal = new CalendarActivity($application, $workspace, $user);
            $this->doctrine->persist($cal);

            $this->doctrine->flush();

            $data = Array(
                "type" => "update",
                "calendarActivity" => $cal->getAsArray()
            );
            $this->pusher->push($data, "calendar/workspace/" . $workspaceId);

            return $cal;
        }
    }

    public function readAll($application, $workspace, $user)
    {

        $nRepo = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarActivity");

        $search = Array(
            "user" => $user
        );

        if ($application) {
            $search["application"] = $application;
        }

        if ($workspace) {
            $search["workspace"] = $workspace;
        }

        $notif = $nRepo->findBy($search);


        foreach ($notif as $not) {
            $data = Array(
                "type" => "update",
                "CalendarActivity" => $not->getAsArray()
            );
            $data["CalendarActivity"]["read"] = true;
            $this->pusher->push($data, "calendar/workspace/" . $not->getWorkspace()->getId());
        }

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
        $acti = $nRepo->findBy(Array("user"=> $user, "workspace" => $workspace, "isRead" => 0),$limit+$offset);
        $data = Array();
        foreach($acti as $a){

            array_push($data, $a->getAsArray());
        }

        return $data;
            //TODO
    }
}