<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 14/02/18
 * Time: 10:32
 */

namespace Administration\AuthenticationBundle\Repository;
use Symfony\Bridge\Doctrine\RegistryInterface;
use Administration\AuthenticationBundle\Entity\ServerCpuStats;

class ServerCpuStatsRepository extends \Doctrine\ORM\EntityRepository
{
    public function getLastId()
    {
        $req1 = $this->createQueryBuilder('U')
            ->select('U.id')
            ->orderBy('U.id', 'DESC')
            ->setMaxResults(1);
        return $req1->getQuery()->getSingleScalarResult();
    }

    public function getAllCpuData($startdate, $enddate)
    {
        $req1 = $this->createQueryBuilder('U')
            ->select('U.dateSave, U.idle, U.usr')
            ->where('U.dateSave >= :start')
            ->andWhere('U.dateSave <= :end')
            ->setParameter("start",$startdate)
            ->setParameter("end",$enddate)
            ->orderBy('U.dateSave');
        return $req1->getQuery()->getResult();
    }
}