<?php


namespace WebsiteApi\CalendarBundle\Services;

use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\CalendarBundle\Entity\CalendarEvent;
use WebsiteApi\CalendarBundle\Entity\Event;
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

    public function __construct($doctrine, $pusher, $workspaceLevels){
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->workspaceLevels = $workspaceLevels;
    }

    public function createEvent($workspaceId, $calendarId, $event, $currentUserId = null, $addMySelf = false)
    {

        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:write")) {
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
        $event->setCalendar($calendar);

        $this->doctrine->persist($event);
        $this->doctrine->flush();

        if($addMySelf){
            $this->addUsers($workspaceId, $calendarId, $event->getId(), Array($currentUserId), $currentUserId);
        }


        $data = Array(
            "type" => "create",
            "event" => $event->getAsArray()
        );
        $this->pusher->push($data, "calendar_topic", Array("id"=>$calendarId));

        return $event;

    }

    public function updateEvent($workspaceId, $calendarId, $eventId, $eventArray, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:write")) {
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
        $this->pusher->push($data, "calendar_topic", Array("id"=>$calendarId));

        return $event;
    }

    public function removeEvent($workspaceId, $calendarId, $eventId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:write")) {
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
        $this->pusher->push($data, "calendar_topic", Array("id"=>$calendarId));

        return true;
    }

    public function addUsers($workspaceId, $calendarId, $eventId, $usersId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:write")) {
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

        foreach ($usersId as $userId) {
            $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($userId);
            $userLinked = new LinkEventUser($user, $event);
            $userLinked->setFrom($event->getFrom());
            $userLinked->setTo($event->getTo());
            $this->doctrine->persist($userLinked);
        }
        $this->doctrine->flush();

        return true;

    }

    public function removeUsers($workspaceId, $calendarId, $eventId, $usersId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:write")) {
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
        }
        $this->doctrine->flush();

        return true;
    }

    public function getEventsForWorkspace($workspaceId, $from, $to, $calendarsId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:read")) {
            return null;
        }

        $events = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->getCalendarsEventsBy($from, $to, $calendarsId);

        return $events;
    }

    public function getEventsForUser($workspaceId, $from, $to, $currentUserId)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:read")) {
            return null;
        }

        $eventsLinks = $this->doctrine->getRepository("TwakeCalendarBundle:LinkEventUser")->getForUser($from, $to, $currentUserId);

        $events = Array();
        foreach ($eventsLinks as $eventLink){
            $events[] = $eventLink->getEvent();
        }

        return $events;

    }
}