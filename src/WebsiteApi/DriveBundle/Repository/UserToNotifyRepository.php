<?php

namespace WebsiteApi\DriveBundle\Repository;

/**
 * UserToNotifyRepository
 */
class UserToNotifyRepository extends \WebsiteApi\CoreBundle\Services\DoctrineAdapter\RepositoryAdapter
{
    public function deleteByDriveFile($drivefile)
    {
        $qb = $this->createQueryBuilder("t");

        $qb = $qb->delete()
            ->andWhere('t.drivefile = :drivefile')
            ->setParameter('drivefile', $drivefile);

        return $qb->getQuery()->getResult();
    }
}
