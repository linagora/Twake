<?php

namespace Twake\Core\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * Mail
 *
 * @ORM\Table(name="scheduled_queue_task",options={"engine":"MyISAM",
 *
 *     "scylladb_keys": {{"time":"ASC", "shard":"ASC", "id":"ASC"}}
 * })
 * @ORM\Entity()
 */
class ScheduledTask
{

    /**
     * @ORM\Column(name="time", type="twake_bigint")
     * @ORM\Id
     */
    private $time;

    /**
     * @ORM\Column(name="shard", type="string")
     * @ORM\Id
     */
    private $shard;

    /**
     * @ORM\Column(name="id", type="string")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="timestamp", type="twake_bigint")
     */
    private $timestamp;

    /**
     * @ORM\Column(name="route", type="string")
     */
    private $route;

    /**
     * @ORM\Column(name="data", type="twake_text")
     */
    private $data;

    /**
     * MailTask constructor.
     * @param $data
     */
    public function __construct($timestamp, $shard, $route, $data, $time_interval = 15 * 60)
    {
        $this->route = $route;
        $this->time = floor(($timestamp / $time_interval)) * $time_interval;
        $this->timestamp = $timestamp;
        $this->shard = $shard . "";
        $this->setData($data);
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
    public function setId($id): void
    {
        $this->id = $id . "";
    }

    /**
     * @return mixed
     */
    public function getData()
    {
        return json_decode($this->data, 1);
    }

    /**
     * @param mixed $data
     */
    public function setData($data): void
    {
        $this->data = json_encode($data);
    }

    /**
     * @return mixed
     */
    public function getTimestamp()
    {
        return $this->timestamp;
    }

    /**
     * @return mixed
     */
    public function getRoute()
    {
        return $this->route;
    }


}
