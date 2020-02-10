<?php


namespace AdministrationApi\Counter\Services;

use AdministrationApi\Counter\Entity\StatsCounter;
use App\App;

class CounterService
{

    private $em;

    public function __construct(App $app)
    {
        $this->em = $app->getServices()->get("app.twake_doctrine");
    }

    public function incrementCounter($key, $increment = 1)
    {
        $counter_repository = $this->em->getRepository("AdministrationApi\Counter:StatsCounter");

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

        if (!$increment) {
            return;
        }

        $counter->setIncrementValue($increment);

        $this->em->merge($counter);
        $this->em->flush();
    }

    public function getCounter($key, $beginDate = null, $endDate = null)
    {
        $counter_repository = $this->em->getRepository("AdministrationApi\Counter:StatsCounter");

        $counter_tab = $counter_repository->findBy(Array('counter_key' => $key), array(), 20, null, 'date', 'DESC');

        $rep = false;

        if ($beginDate) {
            $beginValue = strtotime($beginDate);
            $begin = intval(date('Y', $beginValue)) * 1000 + intval(date('z', $beginValue));
        }

        if ($endDate) {
            $endValue = strtotime($endDate);
            $end = intval(date('Y', $endValue)) * 1000 + intval(date('z', $endValue));
        }

        if ($counter_tab) {
            $rep = array();
            foreach ($counter_tab as $counter_entity) {
                $afterBegin = !isset($begin) || $counter_entity->getDate() >= $begin;
                $beforeEnd = !isset($end) || $counter_entity->getDate() <= $end;
                if ($afterBegin && $beforeEnd) {
                    $rep[] = $counter_entity->getAsArray();
                }
            }
        }

        return $rep;
    }

}
