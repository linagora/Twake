<?php

namespace WebsiteApi\CalendarBundle\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * EventNotification
 *
 * @ORM\Table(name="event_notification",options={"engine":"MyISAM", "scylladb_keys": {{"when_ts_week":"ASC", "when_ts": "ASC", "id": "ASC"}, {"event_id":"ASC"}} })
 * @ORM\Entity(repositoryClass="WebsiteApi\CalendarBundle\Repository\EventNotificationRepository")
 */
class EventNotification
{

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="when_ts_week", type="twake_bigint")
     * @ORM\Id
     */
    private $when_ts_week;

    /**
     * @ORM\Column(name="when_ts", type="twake_bigint")
     * @ORM\Id
     */
    private $when_ts;

    /**
     * @ORM\Column(name="event_id", type="twake_timeuuid")
     */
    private $event_id;


    public function __construct($event_id, $ts)
    {
        $this->event_id = $event_id;
        $this->when_ts = $ts;
        $this->when_ts_week = floor($ts / (60 * 60 * 24 * 7)); //Timestamp rounded by week
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
    public function getWhenTsWeek()
    {
        return $this->when_ts_week;
    }

    /**
     * @return mixed
     */
    public function getWhenTs()
    {
        return $this->when_ts;
    }

    /**
     * @return mixed
     */
    public function getEventId()
    {
        return $this->event_id;
    }


}