<?php


namespace WebsiteApi\CalendarBundle\Services;

use DateTime;
use phpDocumentor\Reflection\Types\Array_;
use PHPUnit\Util\Json;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use WebsiteApi\CalendarBundle\Entity\LinkCalendarWorkspace;
use WebsiteApi\CalendarBundle\Model\CalendarsInterface;
use WebsiteApi\CalendarBundle\Entity\Calendar;

/**
 * Manage calendar
 */
class Calendars implements CalendarsInterface
{

    var $doctrine;
    var $pusher;
    var $workspaceLevels;

    public function __construct($doctrine, $pusher, $workspaceLevels){
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->workspaceLevels = $workspaceLevels;
    }

    public function getCalendars($workspaceId, $currentUserId=null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        $result = Array();

        if ($workspace == null) {
            return false;
        } else {

            if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:read")) {
                return null;
            }

            $links = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findBy(Array("workspace" => $workspace));

            foreach ($links as $link) {
                $cal = $link->getCalendar()->getAsArray();
                $cal["owner"] = $link->getOwner();
                $cal["application"] = $link->getApplication() ? $link->getApplication()->getId() : null;
                $result[] = $cal;
            }

            //Create calendar if no calendar was found in this workspace
            if (count($links) == 0 && $currentUserId != null) {
                $calendar = $this->createCalendar($workspaceId, "General", "2ab438");
                $cal = $calendar->getAsArray();
                $cal["owner"] = $currentUserId;
                $result[] = $cal;
            }

            return $result;
        }
    }

    /**
     * codé par une stagiaire et ça marche
     * @param $workspaceId
     * @param $calendarId
     * @return array|bool
     */
    public function getCalendarById($workspaceId, $calendarId){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));


        $result = Array();

        if ($workspace == null || $calendarId == null ) {
            return false;
        } else {
            $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendarId);
            $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("calendar"=>$calendar, "workspace"=>$workspace));

            if(!$calendarLink){
                return null;
            }else{

                $cal = $calendar->getAsArray();

            }

            return $cal;
        }
    }

    public function createCalendar($workspaceId, $title, $color, $currentUserId = null, $icsLink = null, $app = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:manage")) {
            return null;
        }

        if ($workspace == null) {
            return false;
        } else {

            if (strlen($title) == 0) {
                $title = "New calendar";
            }

            $cal = new Calendar($title, $color,$icsLink);
            $cal->setWorkspacesNumber(1);
            $this->doctrine->persist($cal);

            $link = new LinkCalendarWorkspace($workspace, $cal, true);

            if ($app) {
                $link->setApplication($app);
            }

            $this->doctrine->persist($link);

            $this->doctrine->flush();

            $data = Array(
                "type" => "update",
                "calendar" => $cal->getAsArray()
            );
            $this->pusher->push($data, "calendar/workspace/".$workspaceId);


            return $cal;
        }
    }

    public function updateCalendar($workspaceId, $calendarId, $title, $color, $currentUserId = null, $autoParticipate = Array())
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:manage")) {
            return null;
        }
        /* @var Calendar $calendar */

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendarId);
        $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("calendar"=>$calendar, "workspace"=>$workspace));


        if(!$calendarLink || !$calendarLink->getCalendarRight()){
            return null;
        }

        $calendar->setTitle($title);
        $calendar->setColor($color);

        $calendar->setAutoParticipantList($autoParticipate);

        $calendar->setLastUpdateDate(new DateTime('now'));

        $this->doctrine->persist($calendar);
        $this->doctrine->flush();

        $links = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findBy(Array("calendar" => $calendar));
        foreach ($links as $link) {
            $data = Array(
                "type" => "update",
                "calendar" => $calendar->getAsArray()
            );
            $this->pusher->push($data, "calendar/workspace/" . $link->getWorkspace()->getId());
        }

        return $calendar;

    }

    public function removeCalendar($workspaceId, $calendarId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:manage")) {
            return null;
        }

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendarId);
        $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("calendar"=>$calendar, "workspace"=>$workspace));

        if(!$calendarLink || !$calendarLink->getCalendarRight()){
            return null;
        }

        $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->removeAllByCalendar($calendar);

        $links = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findBy(Array("calendar" => $calendar));
        foreach ($links as $link) {
            $data = Array(
                "type" => "remove",
                "calendar_id" => $calendarId
            );
            $this->pusher->push($data, "calendar/workspace/" . $link->getWorkspace()->getId());
            $this->doctrine->remove($link);
        }

        $this->doctrine->remove($calendar);
        $this->doctrine->flush();

        return 1;

    }

    public function shareCalendar($workspaceId, $calendarId, $other_workspaceId, $hasAllRights = true, $currentUserId = null)
    {
        $calendarLinkAlready = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("calendar"=>$calendarId, "workspace"=>$other_workspaceId));

        if($calendarLinkAlready != false ){
            return "stop";
        }

        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));


        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:manage")) {
            return null;
        }

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendarId);

        $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("calendar"=>$calendar, "workspace"=>$workspace));

        if(!$calendarLink || !$calendarLink->getCalendarRight()){
            return null;
        }

        $other_workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $other_workspaceId, "isDeleted" => false));

        $otherCalendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("calendar" => $calendar, "workspace" => $other_workspace));
        if ($otherCalendarLink) {
            return; //Already exists
        }

        $shareLink = new LinkCalendarWorkspace($other_workspace, $calendar, false, $hasAllRights);

        $calendar->setWorkspacesNumber($calendar->getWorkspacesNumber()+1);
        $this->doctrine->persist($calendar);

        $this->doctrine->persist($shareLink);
        $this->doctrine->flush();

        $data = Array(
            "type" => "update",
            "calendar" => $calendar->getAsArray()
        );
        $this->pusher->push($data, "calendar/workspace/".$workspaceId);
        $this->pusher->push($data, "calendar/workspace/".$other_workspaceId);

        return 1;
    }

    public function unshareCalendar($workspaceId, $calendarId, $other_workspaceId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:manage")) {
            return null;
        }

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendarId);
        $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("calendar"=>$calendar, "workspace"=>$workspace));

        if(!$calendarLink || !$calendarLink->getCalendarRight()){
            return null;
        }

        $other_workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $other_workspaceId, "isDeleted" => false));
        $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findOneBy(Array("calendar"=>$calendar, "workspace"=>$other_workspace));

        $calendar->setWorkspacesNumber($calendar->getWorkspacesNumber()-1);
        $this->doctrine->persist($calendar);

        $this->doctrine->remove($calendarLink);
        $this->doctrine->flush();

        if($workspaceId!=$other_workspaceId) {
            $data = Array(
                "type" => "update",
                "calendar" => $calendar->getAsArray()
            );
            $this->pusher->push($data, "calendar/workspace/".$workspaceId);
        }

        $data = Array(
            "type" => "delete",
            "calendar_id" => $calendarId
        );
        $this->pusher->push($data, "calendar/workspace/".$other_workspaceId);

        return 1;
    }

    public function getCalendarShare($workspaceId, $calendarId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:read")) {
            return null;
        }

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendarId);
        $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findBy(Array("calendar"=>$calendar));

        if(!$calendarLink || !is_array($calendarLink)){
            return null;
        }
        $allLinks = [] ;
        foreach ($calendarLink as $calLink){
            if($calLink->getWorkspace()->getId() != $workspaceId && $calLink->getCalendarRight()){
                $allLinks[] = $calLink;
            }
        }


        return $allLinks;
    }

    public function getCalendarForApp($workspaceId, $appId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->find($appId);

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:write")) {
            return null;
        }

        $calendarLink = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findBy(Array("workspace" => $workspace, "application" => $application));

        if (!$calendarLink) {
            //Create calendar for app
            return $this->createCalendar($workspaceId, $application->getName(), $application->getColor(), $currentUserId, null, $application);
        } else {
            return $calendarLink->getCalendar();
        }

    }

    public function addWorkspaceMember($workspace, $user)
    {
        //Nothing to do
    }

    public function delWorkspaceMember($workspace, $user)
    {
        //Nothing to do
    }

}