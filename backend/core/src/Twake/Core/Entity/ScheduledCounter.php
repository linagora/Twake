<?php

namespace Twake\Core\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Counter
 *
 * @ORM\Table(name="scheduled_queue_counter",options={"engine":"MyISAM", "scylladb_keys": {{"time":"ASC", "type":"ASC"}} })
 * @ORM\Entity()
 */
class ScheduledCounter
{

    /**
     * @ORM\Column(name="time", type="twake_bigint")
     * @ORM\Id
     */
    private $time;

    /**
     * @ORM\Column(name="type", type="string")
     * @ORM\Id
     */
    protected $type;

    /**
     * @ORM\Column(name="value", type="twake_counter")
     */
    protected $value;

    public function __construct($timestamp, $type, $time_interval = 15 * 60)
    {
        $this->type = $type;
        $this->time = floor(($timestamp / $time_interval)) * $time_interval;
    }

    /**
     * @return mixed
     */
    public function getValue()
    {
        return $this->value || 0;
    }

    /**
     * @param mixed $value BE CAREFUL THIS IS A COUNTER ! SO IT WILL BE AN ADD NOT A SET
     */
    public function setIncrementValue($value)
    {
        $this->value = $value;
    }

    /**
     * @return float|int
     */
    public function getTime()
    {
        return $this->time;
    }

    /**
     * @return mixed
     */
    public function getType()
    {
        return $this->type;
    }

}
