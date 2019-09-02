<?php
namespace AdministrationApi\CounterBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Counter
 *
 * @ORM\Table(name="stats_counter",options={"engine":"MyISAM", "scylladb_keys": {{"counter_key":"ASC", "date":"DESC"}} })
 * @ORM\Entity(repositoryClass="AdministrationApi\CounterBundle\Repository\CounterRepository")
 */
class StatsCounter
{

    /**
     * @ORM\Column(name="counter_key", type="string", length=50)
     * @ORM\Id
     */
    protected $counter_key;

    /**
     * @ORM\Column(name="date", type="integer")
     * @ORM\Id
     */
    protected $date;

    /**
     * @ORM\Column(name="value", type="twake_counter")
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
     * @param mixed $value BE CAREFUL THIS IS A COUNTER ! SO IT WILL BE AN ADD NOT A SET
     */
    public function setIncrementValue($value)
    {
        $this->value = $value;
    }

    public function getAsArray() {
        $date = \DateTime::createFromFormat("d/m/y",date("d/m/Y"));
        $date->setDate(intdiv($this->getDate(),1000),1,1);
        $days = $this->getDate() % 1000;
        $date->add(new DateInterval("P".$days."D"));
        $date_string = date("d/m/Y", $date->getTimestamp());
        return array(
            "date" => $date_string,
            "value" => $this->getValue()
        );
    }

}
