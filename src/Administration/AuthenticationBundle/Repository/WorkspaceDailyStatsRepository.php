<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 17/01/18
 * Time: 10:40
 */

namespace Administration\AuthenticationBundle\Repository;

use Symfony\Bridge\Doctrine\RegistryInterface;
use Administration\AuthenticationBundle\Entity\WorkspaceDailyStats;

class WorkspaceDailyStatsRepository extends \Doctrine\ORM\EntityRepository
{
    public function getStatsPublicMessageByWorkspace($idWorkspace,$startdate,$enddate){

        $req = $this->createQueryBuilder('U')
            ->select('U.date, U.publicMsgCount')
            ->where('U.workspace = ' . $idWorkspace)
            ->andWhere('U.date >= :start')
            ->andWhere('U.date <= :end')
            ->setParameter("start",$startdate)
            ->setParameter("end",$enddate)
            ->orderBy('U.date', 'ASC');

        return $req->getQuery()->getResult();
    }
}