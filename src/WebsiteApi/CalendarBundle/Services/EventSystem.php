<?php


namespace WebsiteApi\CalendarBundle\Services;

use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\CalendarBundle\Entity\TwakeEvent;
use WebsiteApi\CalendarBundle\Entity\LinkEventUser;
use WebsiteApi\CalendarBundle\Model\EventCalendarInterface;

/**
 * Manage calendar
 */
class EventSystem implements EventCalendarInterface
{

    var $doctrine;

    public function __construct($doctrine){
        $this->doctrine = $doctrine;
    }

    public function createEvent($owner, $title, $startDate, $endDate, $description, $location, $color, $cal)
    {
        $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $owner));
        $linkCalendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->findOneBy(Array("id" => $cal));
        if ($user == null) {
            return false;
        } else {
            $event = new TwakeEvent($title,$location, $description, new \DateTime($startDate), new \DateTime($endDate), $color, $linkCalendar, null);
            $this->doctrine->persist($event);

            $link = new LinkEventUser($user, $event);
            $this->doctrine->persist($link);

            $this->doctrine->flush();
        }
    }

    public function getEventsByOwner($owner)
    {
        $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $owner));
        $result = Array();

        if ($user == null) {
            return false;
        } else {
            $links = $this->doctrine->getRepository("TwakeCalendarBundle:LinkEventUser")->findBy(Array("user" => $user));
            foreach ($links as $link){
                $result[] = $link->getEvent()->getArray();
            }
            return $result;
        }
    }

    public function getEventsByCalendar($cal)
    {
        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->findOneBy(Array("id" => $cal));
        $result = Array();

        if ($calendar == null) {
            return false;
        } else {
            $events = $this->doctrine->getRepository("TwakeCalendarBundle:TwakeEvent")->findBy(Array("linkCalendar" => $cal));
            foreach ($events as $event){
                $result[] = $event->getArray();
            }
            return $result;
        }
    }
}