<?php

namespace WebsiteApi\CalendarBundle\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * EventNotification
 *
 * @ORM\Table(name="event",options={"engine":"MyISAM", "scylladb_keys": {{"when_ts_week":"ASC", "when_ts": "ASC", "when_ts_week": "ASC"}, {"event_id":"ASC"}} })
 * @ORM\Entity(repositoryClass="WebsiteApi\CalendarBundle\Repository\EventRepository")
 */
class EventNotification
{

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;


    public function __construct($title, $from, $to)
    {
        $this->setTitle($title);
        $this->setFrom($from);
        $this->setTo($to);
    }


}