<?php


namespace AdministrationApi\CounterBundle\Services;

use AdministrationApi\CounterBundle\Entity\Counter;

class CounterService
{

    private $em;

    public function __construct($em)
    {
        $this->em = $em;
    }

    public function incrementCounter($key, $increment = 1)
    {
        $counter_repository = $this->em->getRepository("AdministrationApiCounterBundle:Counter");

        $counter_tab = $counter_repository->findBy(Array('counter_key' => $key), array(), 1, null, 'date', 'DESC');
        $last_counter = $counter_tab[0];

        if (!$counter_tab || $last_counter->getDate() != date("Y-m-d")) {
            $counter = new Counter($key, date("Y-m-d"));
            if ($last_counter) {
                $counter->setValue($last_counter->getValue());
            }
        } else {
            $counter = $last_counter;
        }

        $counter->setValue($counter->getValue() + $increment);

        $this->em->persist($counter);
        $this->em->flush();
    }

    public function getCounter($key) {
        $counter_repository = $this->em->getRepository("AdministrationApiCounterBundle:Counter");

        $counter_tab = $counter_repository->findBy(Array('counter_key'=>$key), array('date' => 'DESC')); //TODO a changer quand j'aurai pull

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