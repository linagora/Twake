<?php


namespace WebsiteApi\CalendarBundle\Services;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use WebsiteApi\CalendarBundle\Entity\LinkCalendarGroup;
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

    public function createCalendar($group, $title, $description)
    {
        $organization = $this->doctrine->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id" => $group, "isDeleted" => false));

        if ($organization == null) {
            return false;
        } else {
            $cal = new Calendar($title, $description);
            $this->doctrine->persist($cal);

            $link = new LinkCalendarGroup($organization, $cal);
            $this->doctrine->persist($link);

            $this->doctrine->flush();
        }
    }

    public function getCalendars($group)
    {
        $organization = $this->doctrine->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id" => $group, "isDeleted" => false));
        $result = Array();

        if ($organization == null) {
            return false;
        } else {
            $links = $this->doctrine->getRepository("TwakeCalendarBundle:LinkCalendarGroup")->findBy(Array("orga" => $organization));
            foreach ($links as $link) {
                $cal = $link->getCalendar()->getArray();
                $events = $this->doctrine->getRepository("TwakeCalendarBundle:TwakeEvent")->findBy(Array("linkCalendar" => $cal));
                $events = $this->doctrine->getRepository("TwakeCalendarBundle:TwakeEvent")->findBy(Array("linkCalendar" => $cal));
                foreach($events as $event){
                    $cal["events"][] = $event->getArray();
                }
                $result[] = $cal;
            }
            return $result;
        }
    }
}