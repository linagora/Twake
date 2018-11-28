<?php

namespace WebsiteApi\DriveBundle\Repository;

/**
 * DriveFileLabelRepository
 */
class DriveFileLabelRepository extends \WebsiteApi\CoreBundle\Services\DoctrineAdapter\RepositoryAdapter
{
    public function countByLabel($label)
    {
        $qb = $this->createQueryBuilder('f')
            ->select('count(f)')
            ->where('f.label = :label')
            ->setParameter("label", $label);

        $qb = $qb->getQuery()->getSingleScalarResult();

        return $qb;
    }
}
