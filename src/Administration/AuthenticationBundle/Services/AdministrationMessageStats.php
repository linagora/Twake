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
use Symfony\Component\Validator\Constraints\DateTime;

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

    public function countDailyMessageByWorkspace($idWorkspace){
        $repository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceStats");
        $twakeWorkspaceStat =  $repository->findOneBy(Array("workspace"=>$idWorkspace));
        if($twakeWorkspaceStat == null){
            return null;
        }
        $workspaceDailyStats = new UserDailyStats();
        $workspaceDailyStats->setWorkspace($twakeWorkspaceStat->getWorkspace());
        $workspaceDailyStats->setPublicMsgCount($twakeWorkspaceStat->getPublicMsgCount());
        $workspaceDailyStats->setPrivateMsgCount($twakeWorkspaceStat->getPrivateMsgCount());
        $workspaceDailyStats->setDate(new \DateTime("now"));
        $this->doctrine->persist($workspaceDailyStats);
        $this->doctrine->flush();
    }

    public function countPublicMessage($idTwakeUser,$startdate,$enddate){
        $repository = $this->doctrine->getRepository("AdministrationAuthenticationBundle:UserDailyStats");
        $twakeUserStat =  $repository->getStatsPublicMessage($idTwakeUser,$startdate,$enddate);
        if($twakeUserStat == null){
            return 0;
        }
        return $twakeUserStat;
    }

    public function countPrivateMessage($idTwakeUser,$startdate,$enddate){
        $repository = $this->doctrine->getRepository("AdministrationAuthenticationBundle:UserDailyStats");
        $twakeUserStat =  $repository->getStatsPrivateMessage($idTwakeUser,$startdate,$enddate);
        if($twakeUserStat == null){
            return null;
        }
        return $twakeUserStat;
    }


    public function numberOfMessagePrivateByUserByWorkspace($idWorkSpace,$startdate,$enddate){

        $repository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $twakeUser =  $repository->findOneBy(Array("id"=>$idWorkSpace))->getMembers();
        $repository = $this->doctrine->getRepository("AdministrationAuthenticationBundle:UserDailyStats");
        $sum = 0;
        $tabRes = Array();
        foreach ($twakeUser as $user){
            $tabRes[$sum]= $repository->getStatsPrivateMessageByWorkspace($user->getUser()->getId(),$startdate,$enddate);
            $sum++;
        }
        return $tabRes;

    }

    public function numberOfMessagePublicByWorkspace($idWorkSpace,$startdate,$enddate){
        $repository = $this->doctrine->getRepository("AdministrationAuthenticationBundle:WorkspaceDailyStats");
        $publicMessageByWorkspace =  $repository->getStatsPublicMessageByWorkspace($idWorkSpace,$startdate,$enddate);
        return $publicMessageByWorkspace;
    }

}