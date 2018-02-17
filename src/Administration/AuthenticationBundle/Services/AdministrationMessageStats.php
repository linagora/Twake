<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 17/01/18
 * Time: 10:47
 */

namespace Administration\AuthenticationBundle\Services;


use Administration\AuthenticationBundle\Entity\WorkspaceDailyStats;
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

    public function countDailyMessageAll()
    {
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:UserStats");
        $statsUsers = $repository->findAll();
        foreach ($statsUsers as $stat)
        {
            $userDailyStats = new UserDailyStats();
            $userDailyStats->setUser($stat->getUser());
            $userDailyStats->setPublicMsgCount($stat->getPublicMsgCount());
            $userDailyStats->setPrivateMsgCount($stat->getPrivateMsgCount());
            $userDailyStats->setDate(new \DateTime("now"));
            $stat->setPublicMsgCount(0);
            $stat->setPrivateMsgCount(0);
            $this->doctrine->persist($userDailyStats);
            $this->doctrine->persist($stat);
        }
        $this->doctrine->flush();
    }

    public function countDailyMessageByWorkspace($idWorkspace){
        $repository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceStats");
        $twakeWorkspaceStat =  $repository->findOneBy(Array("workspace"=>$idWorkspace));
        if($twakeWorkspaceStat == null){
            return null;
        }
        $workspaceDailyStats = new WorkspaceDailyStats();
        $workspaceDailyStats->setWorkspace($twakeWorkspaceStat->getWorkspace());
        $workspaceDailyStats->setPublicMsgCount($twakeWorkspaceStat->getPublicMsgCount());
        $workspaceDailyStats->setPrivateMsgCount($twakeWorkspaceStat->getPrivateMsgCount());
	    $workspaceDailyStats->setPrivateChannelMsgCount($twakeWorkspaceStat->getPrivateChannelMsgCount());
        $workspaceDailyStats->setDate(new \DateTime("now"));
        $this->doctrine->persist($workspaceDailyStats);
        $this->doctrine->flush();
    }

    public function countDailyMessageByWorkspaceAll()
    {
        $repository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceStats");
        $statsWorkspace = $repository->findAll();
        foreach ($statsWorkspace as $stat)
        {
            $workspaceDailyStats = new WorkspaceDailyStats();
            $workspaceDailyStats->setWorkspace($stat->getWorkspace());
            $workspaceDailyStats->setPublicMsgCount($stat->getPublicMsgCount());
            $workspaceDailyStats->setPrivateMsgCount($stat->getPrivateMsgCount());
            $workspaceDailyStats->setPrivateChannelMsgCount($stat->getPrivateChannelMsgCount());
            $workspaceDailyStats->setDate(new \DateTime("now"));

            $stat->setPublicMsgCount(0);
            $stat->setPrivateMsgCount(0);
            $stat->setPrivateChannelMsgCount(0);

            $this->doctrine->persist($workspaceDailyStats);
            $this->doctrine->persist($stat);
        }

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
            return 0;
        }
        return $twakeUserStat;
    }

    public function countAllMessageByUser($idTwakeUser){
        $repository = $this->doctrine->getRepository("AdministrationAuthenticationBundle:UserDailyStats");
        $twakeUserStat =  $repository->getStatsMessageByUser($idTwakeUser);
        if($twakeUserStat == null){
            return 0;
        }
        return $twakeUserStat;
    }


    public function numberOfMessagePrivateByUserByWorkspace($idWorkSpace,$startdate,$enddate){

        $repository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
        $link =  $repository->findBy(Array("workspace"=>$idWorkSpace));
        $repository = $this->doctrine->getRepository("AdministrationAuthenticationBundle:UserDailyStats");
        //$res = null;
        $users = Array();
        foreach ($link as $user){
            $users[] = $user->getUser()->getId();
        }
        $res= $repository->getStatsPrivateMessageByWorkspace($users,$startdate,$enddate);
        return $res;

    }

    public function numberOfMessagePublicByWorkspace($idWorkSpace,$startdate,$enddate){
        $repository = $this->doctrine->getRepository("AdministrationAuthenticationBundle:WorkspaceDailyStats");
        $publicMessageByWorkspace =  $repository->getStatsPublicMessageByWorkspace($idWorkSpace,$startdate,$enddate);
        return $publicMessageByWorkspace;
    }

}