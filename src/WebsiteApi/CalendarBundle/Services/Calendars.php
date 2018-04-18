<?php


namespace WebsiteApi\CalendarBundle\Services;

use phpDocumentor\Reflection\Types\Array_;
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

    public function getCalendars($workspace, $currentUserId=null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace, "isDeleted" => false));
        $result = Array();

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:read")) {
            return null;
        }

        if ($workspace == null) {
            return false;
        } else {
            $links = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findBy(Array("workspace" => $workspace));

            //Create calendar if no calendar was found in this workspace
            if(count($links)==0){
                $calendar = $this->createCalendar($workspace, "Default", "E2333A");
                $links = [$calendar];
            }

            foreach ($links as $link) {
                $cal = $link->getCalendar()->getAsArray();
                $events = $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->findBy(Array("calendar" => $cal));
                $cal["events"] = Array();
                foreach($events as $event){
                    $cal["events"][] = $event->getAsArray();
                }
                $result[] = $cal;
            }
            return $result;
        }
    }

    public function createCalendar($workspace, $title, $color, $currentUserId=null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace, "isDeleted" => false));

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:manage")) {
            return null;
        }

        if ($workspace == null) {
            return false;
        } else {
            $cal = new Calendar($title, $color);
            $cal->setWorkspacesNumber(1);
            $this->doctrine->persist($cal);

            $link = new LinkCalendarWorkspace($workspace, $cal);
            $this->doctrine->persist($link);

            $this->doctrine->flush();

            return $cal;
        }
    }

    public function removeCalendar($workspace, $calendarId, $currentUserId = null)
    {

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:manage")) {
            return null;
        }

        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendarId);
        $this->doctrine->getRepository("TwakeCalendarBundle:CalendarEvent")->removeAllByCalendar($calendar);
        $this->doctrine->remove($calendar);
        $this->doctrine->flush();
    }

    public function shareCalendar($workspace, $calendarId, $other_workspace, $currentUserId = null)
    {

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:manage")) {
            return null;
        }
        // TODO: Implement shareCalendar() method.
    }

    public function unshareCalendar($workspace, $calendarId, $other_workspace, $currentUserId = null)
    {

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:manage")) {
            return null;
        }
        // TODO: Implement unshareCalendar() method.
    }

    public function getCalendarShare($workspace, $calendarId, $currentUserId = null)
    {

        if (!$this->workspaceLevels->can($workspace->getId(), $currentUserId, "calendar:read")) {
            return null;
        }
        // TODO: Implement getCalendarShare() method.
    }
}