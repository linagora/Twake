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

    public function incrementValue($key, $increment = 1) {
        $counter_repository = $this->em->getRepository("AdministrationApiCounterBundle:Counter");

        $counter_tab = $counter_repository->findBy(Array('counter_key'=>$key), );

        if (count($counter_tab) == 0 || $counter_tab[0]->getDate() != date("d-m-Y")) {
            $counter = new Counter($key, date("d-m-Y"));
        } else {
            $counter = $counter_tab[0];
        }

        $counter->setValue($counter->getValue() + $increment);



        $this->em->flush();
    }

}