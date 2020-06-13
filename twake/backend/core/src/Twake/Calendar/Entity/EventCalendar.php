<?php

namespace Twake\Calendar\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;


/**
 * EventCalendar
 *
 * @ORM\Table(name="event_calendar",options={"engine":"MyISAM", "scylladb_keys": {{"workspace_id":"ASC", "calendar_id": "ASC", "sort_date": "ASC", "id": "ASC"}, {"event_id":"ASC"}} })
 * @ORM\Entity()
 */
class EventCalendar
{

    /**
     * @ORM\Column(name="workspace_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $workspace_id;

    /**
     * @ORM\Column(name="calendar_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $calendar_id;

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="sort_date", type="twake_bigint")
     * @ORM\Id
     */
    private $sort_date;

    /**
     * @ORM\Column(name="event_id", type="twake_timeuuid")
     */
    private $event_id;


    public function __construct($workspace_id, $calendar_id, $event_id, $sort_date)
    {
        $this->workspace_id = $workspace_id;
        $this->calendar_id = $calendar_id;
        $this->event_id = $event_id;
        $this->sort_date = $sort_date;
    }

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getWorkspaceId()
    {
        return $this->workspace_id;
    }

    /**
     * @return mixed
     */
    public function getCalendarId()
    {
        return $this->calendar_id;
    }

    /**
     * @return mixed
     */
    public function getSortDate()
    {
        return $this->sort_date;
    }

    /**
     * @return mixed
     */
    public function getEventId()
    {
        return $this->event_id;
    }


}