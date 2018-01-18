<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 17/01/18
 * Time: 10:39
 */

namespace Administration\AuthenticationBundle\Repository;
use Symfony\Bridge\Doctrine\RegistryInterface;
use Administration\AuthenticationBundle\Entity\UserDailyStats;
use Symfony\Component\Validator\Constraints\DateTime;

class UserDailyStatsRepository extends \Doctrine\ORM\EntityRepository
{
    public function getStatsPublicMessage($idUser,$startdate,$enddate){

        $req = $this->createQueryBuilder('U')
            ->select('SUM(U.publicMsgCount) as fuckyou');
        $req->where('U.user = ' . $idUser);
        $req->andWhere('U.date >= :start');
        $req->andWhere('U.date <= :end');
        $req->setParameter("start",$startdate);
        $req->setParameter("end",$enddate);

        return $req->getQuery()->getSingleScalarResult();
    }
    public function getStatsPrivateMessage($idUser,$startdate,$enddate){
        $req = $this->createQueryBuilder('U')
            ->select('SUM(U.privateMsgCount)');
        $req->where('U.user = ' . $idUser);
        $req->andWhere('U.date >= '.$startdate);
        $req->andWhere('U.date <= '.$enddate);
        return $req->getQuery()->getSingleScalarResult();
    }
}