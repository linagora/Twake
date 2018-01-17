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
    public function getAllConnection($userId,$date)
    {

        $req1 = $this->createQueryBuilder('U')->select('U.dateConnection, U.dureeConnection');
        $req1 = $req1->Where('U.user = \'%' . $userId.'%\'');
        $req1 = $req1->andWhere('SUBSTRING(U.dateConnection,1,10) LIKE \'%'.$date . '%\'');
        $req1 = $req1->getQuery()->getResult();

        return $req1;
    }
}