<?php

namespace WebsiteApi\CalendarBundle\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
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
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\CalendarBundle\Entity\Calendar")
     * @ORM\JoinColumn(nullable=true)
     */
    private $calendar;

    /**
     * @ORM\Column(name="next_reminder", type="twake_bigint")
     */
    private $nextreminder = 0;

    /**
     * @ORM\Column(name="from_ts", type="twake_bigint", nullable=true)
     */
    private $from;

    /**
     * @ORM\Column(name="to_ts", type="twake_bigint", nullable=true)
     */
    private $to;

    /**
     * @ORM\Column(name="event_json", type="twake_text")
     */
    private $event;

    /**
     * @ORM\Column(name="participant", type="twake_text")
     */
    private $participants;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
     * @ORM\JoinColumn(nullable=true)
     */
    private $workspace;

    /**
     * @ORM\Column(type="twake_text", nullable=true)
     */
    private $object_link_cache;

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
        return $this->nextreminder;
    }

    /**
     * @param mixed $nextreminder
     */
    public function setNextReminder($nextreminder)
    {
        $this->nextreminder = $nextreminder;
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
            "workspace" => $this->getWorkspace() ? $this->getWorkspace()->getId() : null,
            "object_link_cache" => $this->getObjectLinkCache()
        );
        if ($this->getParticipants()) {
            foreach ($this->getParticipants() as $participant) {
                $res["participant"][] = (isset($participant["id"]) ? $participant["id"] : $participant);
                $res["participant_full"][] = $participant;
            }
        }
        return $res;
    }
    public function getAsArrayMinimal()
    {
        $completevent = $this->getEvent();
        $event = Array("from" => $completEvent["from"], "to" => $completEvent["to"], "start" => $completEvent["start"], "end" => $completEvent["end"]);
        return Array(
            "id" => $this->getId(),
            "calendar" => $this->getCalendar()->getId(),
            "event" => $event,
            "workspace" => $this->getWorkspace() ? $this->getWorkspace()->getId() : null
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


    public function synchroniseField($fieldname, $value)
    {
        if (!property_exists($this, $fieldname))
            return false;

        $setter = "set" . ucfirst($fieldname);
        $this->$setter($value);

        return true;
    }

    public function get($fieldname)
    {

        $event = $this->getEvent();
        if ($fieldname == "to" && isset($event["typeEvent"]) && $event["typeEvent"] == "reminder") {
            return null;
        }
        if ($fieldname == "from" && isset($event["typeEvent"]) && $event["typeEvent"] == "deadline") {
            return null;
        }

        if (!property_exists($this, $fieldname))
            return false;

        $getter = "get" . ucfirst($fieldname);

        return $this->$getter();
    }

    public function getPushRoute()
    {
        if (!$this->getCalendar()) {
            return false;
        }
        return "calendar/" . $this->getCalendar()->getId();
    }

    public function finishSynchroniseField($data)
    {
        if (!$data["from"]) {
            $this->setFrom($this->getTo() - 30 * 60);
            $event = $this->getEvent();
            $event["typeEvent"] = "deadline";
            $this->setEvent($event);
        } else if (!$data["to"]) {
            $this->setTo($this->getFrom() + 30 * 60);
            $event = $this->getEvent();
            $event["typeEvent"] = "reminder";
            $this->setEvent($event);
        } else {
            $event = $this->getEvent();
            $event["typeEvent"] = "event";
            $this->setEvent($event);
        }
    }

    /**
     * @return mixed
     */
    public function getWorkspace()
    {
        return $this->workspace;
    }

    /**
     * @param mixed $workspace
     */
    public function setWorkspace($workspace)
    {
        $this->workspace = $workspace;
    }

    public function setObjectLinkCache($cache)
    {
        $this->object_link_cache = json_encode($cache);
    }

    public function getObjectLinkCache()
    {
        return json_decode($this->object_link_cache, 1);
    }


}