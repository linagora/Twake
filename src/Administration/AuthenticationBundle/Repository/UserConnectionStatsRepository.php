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
            ->setParameter("start",date("Y-m-d H:m:s", $startdate))
            ->setParameter("end",date("Y-m-d H:m:s", $enddate))
            ->orderBy('U.dateConnection', 'ASC');
        return $req1->getQuery()->getResult();
    }

    public function getConnectionBetweenDate($startDate,$endDate){
        $req = $this->createQueryBuilder('U')
            ->select("IDENTITY(U.user) as userId, SUM(U.dureeConnection) as duree")
            ->Where('U.dateConnection >= :start')
            ->andWhere('U.dateConnection <= :end')
            ->setParameter("start",$startDate)
            ->setParameter("end", $endDate)
            ->groupBy('U.user');
        return $req->getQuery()->getResult();
    }
}