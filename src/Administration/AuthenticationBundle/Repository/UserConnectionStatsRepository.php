<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 17/01/18
 * Time: 14:06
 */

namespace Administration\AuthenticationBundle\Repository;



class UserConnectionStatsRepository extends \Doctrine\ORM\EntityRepository
{
    public function getAllConnection($userId,$startdate,$enddate)
    {
        $req1 = $this->createQueryBuilder('U')
            ->Where('U.user = ' . $userId )
            ->andWhere('U.dateConnection >= :start')
            ->andWhere('U.dateConnection <= :end')
            ->setParameter("start",$startdate)
            ->setParameter("end",$enddate)
            ->orderBy('U.dateConnection', 'ASC');
        return $req1->getQuery()->getResult();
    }
}