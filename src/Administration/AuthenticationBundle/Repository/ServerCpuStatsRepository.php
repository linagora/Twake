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
}