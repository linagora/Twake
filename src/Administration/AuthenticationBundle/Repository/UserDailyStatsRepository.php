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

class UserDailyStatsRepository extends \Doctrine\ORM\EntityRepository
{
    public function getStatsPublicMessage($idUser,$date){
        $req = $this->createQueryBuilder('U')
            ->select('U.publicMsgCount');
        $req->where('U.user = ' . $idUser);
        $req->andWhere('SUBSTRING(U.date,1,10) LIKE \''. $date.'\'');
        return $req->getQuery()->getResult();
    }
    public function getStatsPrivateMessage($idUser,$date){
        $req = $this->createQueryBuilder('U')
            ->select('U.privateMsgCount');
        $req->where('U.user = ' . $idUser);
        $req->andWhere('SUBSTRING(U.date,1,10) LIKE \''. $date.'\'');
        return $req->getQuery()->getResult();
    }
}