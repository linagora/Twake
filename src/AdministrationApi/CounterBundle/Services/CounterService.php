<?php


namespace AdministrationApi\CounterBundle\Services;

use AdministrationApi\CounterBundle\Entity\StatsCounter;

class CounterService
{

    private $em;

    public function __construct($em)
    {
        $this->em = $em;
    }

    public function incrementCounter($key, $increment = 1)
    {
        $counter_repository = $this->em->getRepository("AdministrationApiCounterBundle:StatsCounter");

        $counter_tab = $counter_repository->findBy(Array('counter_key' => $key), array(), 1, null, 'date', 'DESC');
        $last_counter = $counter_tab[0];

        $date_int = intval(date("Y")) * 1000 + intval(date("z"));

        if (!$counter_tab || $last_counter->getDate() != $date_int) {
            $counter = new StatsCounter($key, $date_int);
            if ($last_counter) {
                $increment = $increment + $last_counter->getValue();
            }
        } else {
            $counter = $last_counter;
        }

        $counter->setIncrementValue($increment);

        $this->em->merge($counter);
        $this->em->flush();
    }

    public function getCounter($key) {
        $counter_repository = $this->em->getRepository("AdministrationApiCounterBundle:Counter");

        $counter_tab = $counter_repository->findBy(Array('counter_key' => $key), array(), 20, null, 'date', 'DESC');

        $rep = false;

        if ($counter_tab) {
            $rep = array();
            foreach ($counter_tab as $counter_entity) {
                $rep[] = $counter_entity->getAsArray();
            }
        }

        return $rep;
    }

}
