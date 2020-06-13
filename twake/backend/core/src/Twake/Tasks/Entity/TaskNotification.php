<?php

namespace Twake\Tasks\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;


/**
 * TaskNotification
 *
 * @ORM\Table(name="tasks_task_notification",options={"engine":"MyISAM", "scylladb_keys": {{"when_ts_week":"ASC", "when_ts": "ASC", "id": "ASC"}, {"task_id":"ASC"}} })
 * @ORM\Entity()
 */
class TaskNotification
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
     * @ORM\Column(name="delay", type="twake_bigint")
     */
    private $delay;

    /**
     * @ORM\Column(name="mode", type="twake_no_salt_text")
     */
    private $mode;

    /**
     * @ORM\Column(name="task_id", type="twake_timeuuid")
     */
    private $task_id;


    public function __construct($task_id, $delay, $ts, $mode = "push")
    {
        $this->task_id = $task_id;
        $this->when_ts = $ts;
        $this->when_ts_week = floor($ts / (60 * 60 * 24)); //Timestamp rounded by day
        $this->setDelay($delay);
        $this->setMode($mode);
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
    public function getTaskId()
    {
        return $this->task_id;
    }

    /**
     * @return mixed
     */
    public function getDelay()
    {
        return $this->delay;
    }

    /**
     * @param mixed $delay
     */
    public function setDelay($delay)
    {
        $this->delay = $delay;
    }

    /**
     * @return mixed
     */
    public function getMode()
    {
        return $this->mode;
    }

    /**
     * @param mixed $mode
     */
    public function setMode($mode)
    {
        $this->mode = $mode;
    }


}