<?php


namespace WebsiteApi\CalendarBundle\Services;

use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\CalendarBundle\Entity\CalendarEvent;
use WebsiteApi\CalendarBundle\Entity\Event;
use WebsiteApi\CalendarBundle\Entity\LinkCalendarWorkspace;
use WebsiteApi\CalendarBundle\Entity\LinkEventUser;
use WebsiteApi\CalendarBundle\Model\CalendarEventsInterface;

/**
 * Manage calendar
 */
class CalendarEvents implements CalendarEventsInterface
{

    var $doctrine;
    var $pusher;
    var $workspaceLevels;
    var $notifications;
    var $calendarActivity;

    public function __construct($doctrine, $pusher, $workspaceLevels, $notifications, $serviceCalendarActivity)
    {
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->workspaceLevels = $workspaceLevels;
        $this->notifications = $notifications;
        $this->calendarActivity = $serviceCalendarActivity;
    }

    public function createEvent($workspaceId, $calendarId, $event, $currentUserId = null, $addMySelf = false, $participants=Array())
    {

        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:write")) {
            return null;
        }

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendarId);
        $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("workspace" => $workspace, "calendar" => $calendar));

        if(!$calendarLink){
            return null;
        }

        if(!isset($event["from"]) || !isset($event["to"])){
            return null;
        }

        $event = new CalendarEvent($event, $event["from"], $event["to"]);
        $eventModified = $event->getEvent();
        $eventModified["title"] = isset($event->getEvent()["title"])? $event->getEvent()["title"] : "event";
        $eventModified["typeEvent"] = isset($event->getEvent()["typeEvent"])? $event->getEvent()["typeEvent"] : "event";

        $event->setEvent($eventModified);
        $event->setReminder();
        $event->setCalendar($calendar);
        $participantsArray = Array();
        $this->doctrine->persist($event);
        foreach($participants as $participant)
        {
            $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($participant);
            $this->addUsers($workspaceId,$calendarId,$event,Array($user->getId()));
            $participantsArray[] = $user->getAsArray();
        }
        $calArray = $calendar->getAsArray();

        $event->setParticipant($participantsArray);

        $this->doctrine->persist($event);
        $this->doctrine->flush();

        if ($calArray["autoParticipate"] != null && is_array($calArray["autoParticipate"])) {
            foreach ($calArray["autoParticipate"] as $userAuto){
                error_log($userAuto);
                $this->addUsers($workspaceId, $calendarId, $event->getId(),Array($userAuto["id"]), $currentUserId);
            }
        }

        if($addMySelf){
            $this->addUsers($workspaceId, $calendarId, $event, Array($currentUserId), $currentUserId);
        }


        $data = Array(
            "type" => "create",
            "event" => $event->getAsArray()
        );
        $this->pusher->push($data, "calendar/".$calendarId);

        return $event;

    }

    public function updateEvent($workspaceId, $calendarId, $eventId, $eventArray, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:write")) {
            return null;
        }

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendarId);
        $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("workspace" => $workspace, "calendar" => $calendar));

        if(!$calendarLink){
            return null;
        }

        if(!isset($eventArray["from"]) || !isset($eventArray["to"])){
            return null;
        }

        $event = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->find($eventId);

        if(!$event){
            return null;
        }

        //If we changed calendar verify that old calendar is our calendar
        if($event->getCalendar()->getId() != $calendarId){
            $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("workspace" => $workspace, "calendar" => $event->getCalendar()));
            if(!$calendarLink){
                return null;
            }
        }

        $event->setCalendar($calendar);
        $event->setEvent($eventArray);
        $event->setFrom($eventArray["from"]);
        $event->setTo($eventArray["to"]);
        if (isset($eventArray["reminder"])) {
            $event->setReminder(intval($eventArray["reminder"]));
        } else {
            $event->setReminder();
        }
        $this->doctrine->persist($event);

        $usersLinked = $this->doctrine->getRepository("TwakeCalendarBundle:LinkEventUser")->findBy(Array("event"=>$event));
        foreach ($usersLinked as $userLinked){
            $userLinked->setFrom($event->getFrom());
            $userLinked->setTo($event->getTo());
            $this->doctrine->persist($userLinked);
        }

        $this->doctrine->flush();

        $data = Array(
            "type" => "update",
            "event" => $event->getAsArray()
        );
        $this->pusher->push($data, "calendar/".$calendarId);

        return $event;
    }

    public function removeEvent($workspaceId, $calendarId, $eventId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:write")) {
            return null;
        }

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendarId);
        $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("workspace" => $workspace, "calendar" => $calendar));

        if(!$calendarLink){
            return null;
        }

        $event = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->find($eventId);

        if(!$event || $event->getCalendar()->getId() != $calendarId){
            return null;
        }

        $usersLinked = $this->doctrine->getRepository("TwakeCalendarBundle:LinkEventUser")->findBy(Array("event"=>$event));
        foreach ($usersLinked as $userLinked){
            $this->doctrine->remove($userLinked);
        }

        $this->doctrine->remove($event);
        $this->doctrine->flush();

        $data = Array(
            "type" => "remove",
            "event_id" => $eventId
        );
        $this->pusher->push($data, "calendar/".$calendarId);

        return true;
    }

    public function addUsers($workspaceId, $calendarId, $event, $usersId, $currentUserId = null)
    {
        $eventId = null;
        if(is_int($event) || is_string($event))
            $eventId = $event;
        error_log("ADD USERS");
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:write")) {
            return null;
        }

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendarId);
        $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("workspace" => $workspace, "calendar" => $calendar));

        if(!$calendarLink){
            return null;
        }

        if($eventId!=null)
            $event = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->find($eventId);

        if(!$event || $event->getCalendar()->getId() != $calendarId){
            return null;
        }

        foreach ($usersId as $userId) {
            if($userId != null){ //pour eviter un bug du front
                $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($userId);
                $eventUserRepo = $this->doctrine->getRepository("TwakeCalendarBundle:LinkEventUser");
                $userLink = $eventUserRepo->findBy(Array("user"=>$user,"event"=>$event));
                if($userLink== false){
                    $userLinked = new LinkEventUser($user, $event);
                    $userLinked->setFrom($event->getFrom());
                    $userLinked->setTo($event->getTo());
                    $this->doctrine->persist($userLinked);
                    $participantArray = $event->getParticipant();
                    $participantArray[] = $user->getAsArray();
                    $event->setParticipant($participantArray);
                }

            }

            $this->calendarActivity->pushTable(true, $workspaceId, $user, null, "User added to activity", Array(), Array("notifCode" => $event->getFrom()."/".$event->getId()));
        }
        $this->doctrine->flush();
        $data = Array(
            "type" => "update",
            "event" => $event->getAsArray()
        );
        $this->pusher->push($data, "calendar/".$calendarId);
        return true;

    }

    public function removeUsers($workspaceId, $calendarId, $eventId, $usersId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:write")) {
            return null;
        }

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendarId);
        $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("workspace" => $workspace, "calendar" => $calendar));

        if(!$calendarLink){
            return null;
        }

        $event = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->find($eventId);

        if(!$event || $event->getCalendar()->getId() != $calendarId){
            return null;
        }

        foreach ($usersId as $userId){
            $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($userId);
            $userLinked = $this->doctrine->getRepository("TwakeCalendarBundle:LinkEventUser")->findOneBy(Array("user"=>$user, "event"=>$event));
            $this->doctrine->remove($userLinked);
            $participantArray = $event->getParticipant();
            for($i=0;$i<count($participantArray);$i++){
                if($participantArray[$i]["id"] == $user->getId()){
                    $participantArray = array_splice($participantArray, $i, 1);
                }
            }

            $event->setParticipant($participantArray);
            $this->doctrine->persist($event);
            $this->calendarActivity->pushTable(true, $workspaceId, $user, null, "User removed from activity", Array(), Array("notifCode" => $event->getFrom()."/".$event->getId()));

        }
        $this->doctrine->flush();
        $data = Array(
            "type" => "update",
            "event" => $event->getAsArray()
        );
        $this->pusher->push($data, "calendar/".$calendarId);

        return true;
    }

    public function getEventsForWorkspace($workspaceId, $from, $to, $calendarsId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($workspace==null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:read"))) {
            return null;
        }

        $events = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->getCalendarsEventsBy($from, $to, $calendarsId);

        return $events;
    }

    public function getEvent($eventId,$workspaceId, $currentUserId){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($workspace==null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:read"))) {
            return null;
        }

        /* @var CalendarEvent $event*/
        $event = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->findOneBy(Array("id"=>$eventId));
        /* @var LinkCalendarWorkspace $workspaceLink*/
        $workspaceLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("calendar"=>$event->getCalendar()));

        if(!$workspaceLink)
            return false;

        if($workspaceLink->getWorkspace()->getId()==$workspaceId)
            return $event;

        return false;
    }
    //
    public function getEventsByCalendar($workspaceId, $calendarsId, $currentUserId = null){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        var_dump($workspaceId);
        var_dump($calendarsId);
        if($workspace == null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:read"))){
            return null;
        }
        $events = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->getAllCalendarEventsByCalendar($calendarsId);

        foreach ($events as $link) {
            $evt = $link->getAsArray();

            $result[] = $evt;
        }

        return $result;
    }

    public function getEventsForUser($workspaceId, $from, $to, $currentUserId)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:read")) {
            return null;
        }

        $eventsLinks = $this->doctrine->getRepository("TwakeCalendarBundle:LinkEventUser")->getForUser($from, $to, $currentUserId);

        $events = Array();
        foreach ($eventsLinks as $eventLink){
            $events[] = $eventLink->getEvent();
        }

        return $events;

    }

    public function getEventById($workspaceId, $eventId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:read")) {
            return null;
        }

        if($workspace==null ){
            return null;
        }

        $event = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->find($eventId);
        if(!$event){
            return null;
        }else{

            $event = $event->getAsArray();

        }


        return $event;
    }

    public function getUsers( $eventId, $currentUserId = null)
    {
        $event = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->find($eventId);

        if(!$event ){
            return null;
        }

        $eventUserRepo = $this->doctrine->getRepository("TwakeCalendarBundle:LinkEventUser");
        $users = Array();
        $eventUsers = $eventUserRepo->findBy(Array("event"=>$event));

        foreach ($eventUsers as $user){
            $users[] = $user->getUser()->getAsArray();
        }

        return $users;

    }

    /** Check all events that have to be reminded */
    public function checkReminders()
    {

        /** @var CalendarEvent[] $events */
        $events = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->toRemind();
        $linkRepo = $this->doctrine->getRepository("TwakeCalendarBundle:LinkEventUser");

        $app = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "calendar"));

        foreach ($events as $event) {

            $date = $event->getFrom();
            $in = $date - date("U");
            $in = $in / 60;
            if ($in < 60) {
                $in = intval($in) . " minute(s) ";
            } else if ($in / 60 < 24) {
                $in = intval($in / 60) . " hour(s) ";
            } else {
                $in = intval($in / (60 * 24)) . " day(s) ";
            }

            $title = "Event";
            if (isset($event->getEvent()["title"])) {
                $title = $event->getEvent()["title"];
            }
            $text = $title . " in " . $in;

            $_users = $linkRepo->findBy(Array("event" => $event));
            if (count($_users) > 0) {
                $users = Array();
                foreach ($_users as $user) {
                    $users[] = $user->getUser()->getId();
                }
                $this->notifications->pushNotification($app, null, $users, null, "event_" . $event->getId(), $text, Array("push"), null, false);
            }


            $event->setNextReminder(0);
            $this->doctrine->persist($event);

        }

        $this->doctrine->flush();
        return true;
    }
}