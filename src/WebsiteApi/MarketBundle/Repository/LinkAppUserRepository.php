<?php

namespace WebsiteApi\MarketBundle\Repository;

/**
 * LinkAppUserRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class LinkAppUserRepository extends \Doctrine\ORM\EntityRepository
{
    public function countUserByApp($idApp){
        $req = $this->createQueryBuilder('A')
            ->select('count(A.id)');
        $req->where('A.id = \'' . $idApp.'\'');
        $req = $req->getQuery()->getResult();
        return $req;
    }
}