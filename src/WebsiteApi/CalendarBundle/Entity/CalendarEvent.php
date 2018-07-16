<?php

namespace WebsiteApi\CalendarBundle\Entity;

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
    private $participant;

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
    public function getParticipant()
    {
        return json_decode($this->participant, 1);
    }

    /**
     * @param mixed $event
     */
    public function setParticipant($event)
    {
        $this->participant = json_encode($event);
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
        return Array(
            "id" => $this->getId(),
            "calendar" => $this->getCalendar()->getId(),
            "event" => $this->getEvent(),
            "participant" => $this->getParticipant(),
        );
    }

    public function getRepository(){
        return "TwakeCalendarBundle:CalendarEvent";
    }

    public function getAsArrayFormated(){
        return Array(
            "id" => $this->getId(),
            "title" => "Event",
        );
    }
}