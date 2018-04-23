<?php

namespace WebsiteApi\CalendarBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Event
 *
 * @ORM\Table(name="calendar_event",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CalendarBundle\Repository\CalendarEventRepository")
 */

class CalendarEvent {

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
     * @ORM\Column(name="from", type="integer")
     */
    private $from;

    /**
     * @ORM\Column(name="to", type="integer")
     */
    private $to;

    /**
     * @ORM\Column(name="event", type="string")
     */
    private $event;

    public  function __construct($event, $from, $to)
    {
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

    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "calendar" => $this->getCalendar()->getId(),
            "event" => $this->getEvent()
        );
    }


}