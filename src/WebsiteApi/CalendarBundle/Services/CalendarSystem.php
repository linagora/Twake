<?php


namespace WebsiteApi\CalendarBundle\Services;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use WebsiteApi\CalendarBundle\Entity\LinkCalendarWorkspace;
use WebsiteApi\CalendarBundle\Model\CalendarInterface;
use WebsiteApi\CalendarBundle\Entity\Calendar;

/**
 * Manage calendar
 */
class CalendarSystem implements CalendarInterface
{

    var $doctrine;

    public function __construct($doctrine){
        $this->doctrine = $doctrine;
    }

    public function createCalendar($workspace, $title, $description)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace, "isDeleted" => false));

        if ($workspace == null) {
            return false;
        } else {
            $cal = new Calendar($title, $description);
            $this->doctrine->persist($cal);

            $link = new LinkCalendarWorkspace($workspace, $cal);
            $this->doctrine->persist($link);

            $this->doctrine->flush();
        }
    }

    public function getCalendars($workspace)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace, "isDeleted" => false));
        $result = Array();

        if ($workspace == null) {
            return false;
        } else {
            $links = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarWorkspace")->findBy(Array("workspace" => $workspace));
            foreach ($links as $link) {
                $cal = $link->getCalendar()->getArray();
                $events = $this->doctrine->getRepository("TwakeCalendarBundle:TwakeEvent")->findBy(Array("calendar" => $cal));
                $cal["events"] = Array();
                foreach($events as $event){
                    $cal["events"][] = $event->getArray();
                }
                $result[] = $cal;
            }
            return $result;
        }
    }
}