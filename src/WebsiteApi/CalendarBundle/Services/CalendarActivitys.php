<?php
namespace WebsiteApi\CalendarBundle\Services;

use WebsiteApi\CalendarBundle\Entity\CalendarActivity;
use WebsiteApi\CalendarBundle\Model\CalendarActivityInterface;


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

    public function __construct($doctrine, $pusher)
    {
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
    }

    public function pushTable($pushNotif = true, $application, $workspace, $user = null, $levels = null, $texte = null, $type = Array())
    {
        //ajotuer dans la table CalendarActivity
        if($workspace != null){
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace);
        }

        if($application != null) {
            $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->find($application);
        }

        $cal = new CalendarActivity($application, $workspace, $user);

        $title = "";
        if ($workspace && $workspace->getGroup()) {
            $title .= $workspace->getGroup()->getDisplayName() . " - ";
            $title .= $workspace->getName() . " : ";
        } else {
            $title .= "Private : ";
        }

        if($application){
            $title .= $application->getName();
        }

        $data = Array(
            "type"=>"add",
            "workspace_id"=>($workspace!=null?$workspace->getId():null),
            "app_id"=>($application!=null?$application->getId():null),
            "title" => $title,
            "text" => $texte
        );

        if($data){
            $cal->setData($data);
        }

        if($texte){
            $cal->setText($texte);
        }
        if($title){
            $cal->setTitle($title);
        }

        $this->doctrine->persist($cal);
        $data["action"] = "add";
        $this->pusher->push($data, "calendarActivity/workspace/".$workspace->getId());
        $this->doctrine->flush();

        //appel pour faire une notification
        if($pushNotif){
            $this->get("app.notifications")->pushNotification($application,$workspace,$user,$levels,"calendarActivity",$texte,$type,null,true);

        }

    }


    public function createCalendarActivity($application, $workspaceId, $user){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));


        if ($workspace == null) {
            return false;
        } else {


            $cal = new CalendarActivity($application,$workspace,$user);
            $this->doctrine->persist($cal);

            $this->doctrine->flush();

            $data = Array(
                "type" => "update",
                "calendarActivity" => $cal->getAsArray()
            );
            $this->pusher->push($data, "calendarActivity/workspace/".$workspaceId);

            return $cal;
        }
    }

    public function readAll($application, $workspace, $user)
    {

        $nRepo = $this->doctrine->getRepository("TwakeNotificationsBundle:Notification");

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


        foreach($notif as $not) {
            $data = Array(
                "type" => "update",
                "CalendarActivity" => $not->getAsArray()
            );
            $data["CalendarActivity"]["read"] = true;
            $this->pusher->push($data, "calendarActivity/workspace/". $not->getWorkspace()->getId());
        }

    }
    public function removeAll($application, $workspace, $user, $code = null, $force=false)
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
        for($i = 0; $i < $count; $i++) {
            $this->doctrine->remove($notif[$i]);
        }

        if ($count == 0){
            return false;
        }

        if($count>0 || $force) {
            $this->doctrine->flush();

            $totalNotifications = $this->countAll($user);

            $data = Array(
                "action"=>"remove",
                "workspace_id"=>($workspace)?$workspace->getId():null,
                "app_id"=>($application)?$application->getId():null
            );
            $this->pusher->push($data, "calendarActivity/workspace/".$workspace->getId());

            $this->updateDeviceBadge($user, $totalNotifications);
            return true;
        }
        return true;


    }

    public function getAll($user)
    {
        $nRepo = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarActivity");
        $acti = $nRepo->findBy(Array("user"=>$user), Array("id" => "DESC"), 30); //Limit number of results

        return $acti;
    }
}