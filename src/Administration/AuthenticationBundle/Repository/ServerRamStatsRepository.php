<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 15/02/18
 * Time: 15:27
 */

namespace Administration\AuthenticationBundle\Repository;

use Symfony\Bridge\Doctrine\RegistryInterface;
use Administration\AuthenticationBundle\Entity\ServerRamStats;

class ServerRamStatsRepository extends \WebsiteApi\CoreBundle\Services\DoctrineAdapter\RepositoryAdapter
{

    public function getLastId()
    {
        $req1 = $this->createQueryBuilder('U')
            ->select('U.id')
            ->orderBy('U.id','DESC')
            ->setMaxResults(1);
        return $req1->getQuery()->getSingleScalarResult();
    }

    public function getAllRamData($startdate, $enddate)
    {
        $req1 = $this->createQueryBuilder('U')
            ->select('U.dateSave, U.used')
            ->where('U.dateSave >= :start')
            ->andWhere('U.dateSave <= :end')
            ->setParameter("start",$startdate)
            ->setParameter("end",$enddate)
            ->orderBy('U.dateSave');
        return $req1->getQuery()->getResult();
    }
}