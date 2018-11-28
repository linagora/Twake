<?php

namespace WebsiteApi\ProjectBundle\Repository;

/**
 * LinkTaskUserRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class LinkTaskUserRepository extends \WebsiteApi\CoreBundle\Services\DoctrineAdapter\RepositoryAdapter
{

    public function getForUser($from, $to, $userId){

        $qb = $this->createQueryBuilder('e');
        $qb->where($qb->expr()->gte('e.to', '?1'));
        $qb->andWhere($qb->expr()->lte('e.from', '?2'));
        $qb->andWhere($qb->expr()->eq('e.user', '?3'));
        $qb->setParameter(1, $from);
        $qb->setParameter(2, $to);
        $qb->setParameter(3, $userId);
        $q= $qb->getQuery();
        return $q->getResult();
    }

}