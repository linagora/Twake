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

    public function createEvent($owner, $title, $startDate, $endDate, $description, $location, $color, $cal,$appid)
    {
        $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $owner));
        $calendar = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->findOneBy(Array("id" => $cal));
        if ($user == null) {
            return false;
        } else {
            $start = new \DateTime($startDate);
            $event = new TwakeEvent($title,$location, $description, $start, new \DateTime($endDate), $color, $calendar, null);
            $this->doctrine->persist($event);

            $link = new LinkEventUser($user, $event);
            $this->doctrine->persist($link);

            $this->doctrine->flush();
            return $event;
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
                $result[] = $link->getEvent()->getAsArray();
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
            $events = $this->doctrine->getRepository("TwakeCalendarBundle:TwakeEvent")->findBy(Array("calendar" => $cal));
            foreach ($events as $event){
                $result[] = $event->getAsArray();
            }
            return $result;
        }
    }

    public function updateEvent($id,$owner,$title,$startDate,$endDate,$description,$location,$color,$calendar,$appid){
        $event = $this->doctrine->getRepository("TwakeCalendarBundle:TwakeEvent")->find($id);
        if($event != null){
            if($owner!=null){
                $user = $this->doctrine->getRepository("TwakeUsersBundle:user")->find($owner);
                if($user!=null){
                    error_log("owner");
                    $event->setOwner($owner);
                }
            }
            if($title != null){
                error_log("title");
                $event->setTitle($title);
            }
            if($startDate != null){
                error_log("start");
                $event->setStartDate( new \DateTime($startDate));
                error_log("start Date change");
            }
            if($endDate != null){
                error_log("end");
                $event->setEndDate( new \DateTime($endDate));
                error_log("end Date change");
            }
            if($description != null){
                error_log("description");
                $event->setDescription($description);
            }
            if($location!= null){
                error_log("location");
                $event->setLocation($location);
            }
            if($color != null){
                $event->setColor($color);
            }
            if($calendar != null){
                error_log("calendar");
                $calendarEntity = $this->doctrine->getRepository("TwakeCalendarBundle:Calendar")->find($calendar);
                if($calendarEntity != null){
                    $event->setCalendar($calendarEntity);
                }
            }
            if($appid != null){
                error_log("appid");
                $app = $this->doctrine->getRepository("TwakeMarketBundle:Application")->find($appid);
                if($app =! null){
                    $event->setApplication($app);
                }
            }
            $this->doctrine->persist($event);
            $this->doctrine->flush();
            return $event;
        }
        return false;
    }

}