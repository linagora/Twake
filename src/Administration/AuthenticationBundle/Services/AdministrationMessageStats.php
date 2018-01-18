<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 17/01/18
 * Time: 10:47
 */

namespace Administration\AuthenticationBundle\Services;


use Administration\AuthenticationBundle\Model\AdministrationMessageStatsInterface;
use Administration\AuthenticationBundle\Entity\UserDailyStats;

class AdministrationMessageStats implements AdministrationMessageStatsInterface
{
    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    //countDailyMessage count the number of messages sent by the $idTwakeUser
    public function countDailyMessage($idTwakeUser){
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:UserStats");
        $twakeUserStat =  $repository->findOneBy(Array("user"=>$idTwakeUser));
        if($twakeUserStat == null){
            return null;
        }
        $userDailyStats = new UserDailyStats();
        $userDailyStats->setUser($twakeUserStat->getUser());
        $userDailyStats->setPublicMsgCount($twakeUserStat->getPublicMsgCount());
        $userDailyStats->setPrivateMsgCount($twakeUserStat->getPrivateMsgCount());
        $userDailyStats->setDate(new \DateTime("now"));
        $this->doctrine->persist($userDailyStats);
        $this->doctrine->flush();
    }

    public function countPublicMessage($idTwakeUser){
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:UserStats");
        $twakeUserStat =  $repository->findOneBy(Array("user"=>$idTwakeUser));
        if($twakeUserStat == null){
            return null;
        }
        return ;
    }

}