<?php

namespace WebsiteApi\DriveBundle\Repository;

/**
 * UserToNotifyRepository
 */
class UserToNotifyRepository extends \Doctrine\ORM\EntityRepository
{
    public function deleteByDriveFile($driveFile){
        $qb = $this->createQueryBuilder("t");

        $qb = $qb->delete()
            ->andWhere('t.driveFile = :driveFile')
            ->setParameter('driveFile', $driveFile);

        return $qb->getQuery()->getResult();
    }
}
