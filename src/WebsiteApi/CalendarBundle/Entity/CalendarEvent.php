<?php

namespace WebsiteApi\CalendarBundle\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\ObjectLinksBundle\Model\ObjectLinksInterface;

/**
 * Event
 *
 * @ORM\Table(name="calendar_event",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CalendarBundle\Repository\CalendarEventRepository")
 */

class CalendarEvent implements ObjectLinksInterface {

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\CalendarBundle\Entity\Calendar")
     * @ORM\JoinColumn(nullable=true)
     */
    private $calendar;

    /**
     * @ORM\Column(name="next_reminder", type="bigint")
     */
    private $nextReminder = 0;

    /**
     * @ORM\Column(name="from_ts", type="bigint")
     */
    private $from;

    /**
     * @ORM\Column(name="to_ts", type="bigint")
     */
    private $to;

    /**
     * @ORM\Column(name="event_json", type="text")
     */
    private $event;

    /**
     * @ORM\Column(name="participant", type="text")
     */
    private $participants;

    public  function __construct($event, $from, $to)
    {
        $this->setEvent($event);
        $this->setFrom($from);
        $this->setTo($to);
        $this->setReminder();
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param int $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getCalendar()
    {
        return $this->calendar;
    }

    /**
     * @param mixed $calendar
     */
    public function setCalendar($calendar)
    {
        $this->calendar = $calendar;
    }

    /**
     * @return mixed
     */
    public function getFrom()
    {
        return $this->from;
    }

    /**
     * @param mixed $from
     */
    public function setFrom($from)
    {
        $this->from = $from;
        $event = $this->getEvent();
        $date = new DateTime();
        $date->setTimestamp($from);
        $event["from"] = $from;
        $event["start"] = $date;
        $this->setEvent($event);
    }

    /**
     * @return mixed
     */
    public function getTo()
    {
        return $this->to;
    }

    /**
     * @param mixed $to
     */
    public function setTo($to)
    {
        $this->to = $to;
        $event = $this->getEvent();
        $date = new DateTime();
        $date->setTimestamp($to);
        $event["to"] = $to;
        $event["end"] = $date;
        $this->setEvent($event);
    }

    /**
     * @return mixed
     */
    public function getEvent()
    {
        return json_decode($this->event, 1);
    }

    /**
     * @param mixed $event
     */
    public function setEvent($event)
    {
        $this->event = json_encode($event);
    }

    /**
     * @return mixed
     */
    public function getParticipants()
    {
        return json_decode($this->participants, 1);
    }

    /**
     * @param mixed $event
     */
    public function setParticipants($event)
    {
        $this->participants = json_encode($event);
    }

    /**
     * @return mixed
     */
    public function getNextReminder()
    {
        return $this->nextReminder;
    }

    /**
     * @param mixed $nextReminder
     */
    public function setNextReminder($nextReminder)
    {
        $this->nextReminder = $nextReminder;
    }

    public function setReminder($delay = 1800)
    {
        if ($this->getFrom() < date("U")) {
            $this->setNextReminder(0);
            return;
        }
        $this->setNextReminder(
            $this->getFrom() - $delay
        );
    }

    public function getAsArray(){
        $res = Array(
            "id" => $this->getId(),
            "calendar" => $this->getCalendar()->getId(),
            "event" => $this->getEvent(),
            "participant" => Array(),
            "participant_full" => Array(),
        );
        foreach ($this->getParticipants() as $participant) {
            $res["participant"][] = (isset($participant["id"]) ? $participant["id"] : $participant);
            $res["participant_full"][] = $participant;
        }
        return $res;
    }
    public function getAsArrayMinimal()
    {
        $completEvent = $this->getEvent();
        $event = Array("from" => $completEvent["from"], "to" => $completEvent["to"], "start" => $completEvent["start"], "end" => $completEvent["end"]);
        return Array(
            "id" => $this->getId(),
            "calendar" => $this->getCalendar()->getId(),
            "event" => $event,
        );
    }

    public function getRepository(){
        return "TwakeCalendarBundle:CalendarEvent";
    }

    public function getAsArrayFormated(){
        return Array(
            "id" => $this->getId(),
            "title" => "Event",
            "object_name" => $this->getEvent()["title"],
            "key" => "calendar",
            "type" => "event",
            "code" => $this->getFrom()."/".$this->getId(),
        );
    }


    public function synchroniseField($fieldName, $value)
    {
        if(!property_exists($this, $fieldName))
            return false;

        $setter = "set".ucfirst($fieldName);
        $this->$setter($value);

        return true;
    }

    public function get($fieldName){

        if(!property_exists($this, $fieldName))
            return false;

        $getter = "get".ucfirst($fieldName);

        return $this->$getter();
    }

    public function getPushRoute()
    {
        if (!$this->getCalendar()) {
            return false;
        }
        return "calendar/" . $this->getCalendar()->getId();
    }

}