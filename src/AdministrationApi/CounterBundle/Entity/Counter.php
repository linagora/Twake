<?php


namespace AdministrationApi\CounterBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator;

/**
 * Class Counter
 *
 * @ORM\Table(name="counter_entity", options={"engine":"MyISAM", "scylladb_keys": {{"counter_key":"ASC", "date":"DESC"}}})
 */
class Counter
{

    /**
     * @var
     *
     * @ORM\Column(name="counter_key", type="string")
     */
    protected $counter_key;

    /**
     * @var
     *
     * @ORM\Column(name="date", type="twake_datetime")
     */
    protected $date;

    /**
     * @var
     *
     * @ORM\Column(name="value", type="integer")
     */
    protected $value;

    public function __construct($counter_key,$date)
    {
        $this->counter_key = $counter_key;
        $this->date = $date;
        $this->value = 0;
    }

    /**
     * @return mixed
     */
    public function getCounterKey()
    {
        return $this->counter_key;
    }

    /**
     * @return mixed
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * @return mixed
     */
    public function getValue()
    {
        return $this->value;
    }

    /**
     * @param mixed $value
     */
    public function setValue($value)
    {
        $this->value = $value;
    }


}