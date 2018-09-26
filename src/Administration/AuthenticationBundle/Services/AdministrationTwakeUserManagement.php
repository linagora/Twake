<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 28/11/17
 * Time: 14:56
 */

namespace Administration\AuthenticationBundle\Services;


use Administration\AuthenticationBundle\Model\AdministrationTwakeUserManagementInterface;
use Administration\AuthenticationBundle\Repository\AdminUserRepository;
use phpDocumentor\Reflection\Types\Array_;

class AdministrationTwakeUserManagement implements AdministrationTwakeUserManagementInterface
{
    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function listTwakeUsers($pageNumber, $nbUserByPage, $filter = null, &$total=null)
    {
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        return $repository->findAllOrderedByName($pageNumber,$nbUserByPage,$filter,$total);
    }

    public function setBannedTwakeUser($idTwakeUser,$bool)
    {
        $em = $this->doctrine;
        $repository = $em->getRepository("TwakeUsersBundle:User");
        $twakeUser =  $repository->findOneBy(Array("id"=>$idTwakeUser));
        if($twakeUser == null){
            return null;
        }
        $twakeUser->setBanned($bool);
        $em->persist($twakeUser);
        $em->flush($twakeUser);
        return $twakeUser;
    }

    public function getInfoUser($idTwakeUser)
    {
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        $twakeUser =  $repository->findOneBy(Array("id"=>$idTwakeUser));
        if($twakeUser == null)
        {
            return null;
        }
        return $twakeUser;
    }

    public function searchUser($pageNumber, $nbUserByPage,$lastName=null,$firstName=null,$userName=null,$email=null,&$total=null){
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        return $repository->findUsersByFilter($pageNumber, $nbUserByPage,$lastName,$firstName,$userName,$email,$total);
    }

    public function getUserApp($idTwakeUser){
        $repository = $this->doctrine->getRepository("TwakeMarketBundle:LinkAppUser");
        $linkAppUserRepository = $repository->findBy(Array("User"=>$idTwakeUser));
        if($linkAppUserRepository == null){
            return null;
        }
        return $linkAppUserRepository->getApplication();
    }

    public function getSizeUploadedByUser($idTwakeUser){
        $repository = $this->doctrine->getRepository("TwakeUploadBundle:File");
        if($idTwakeUser == null){
            return null;
        }
        return $repository->sumAllFileSize($idTwakeUser);
    }

    public function getUserConnectedLastDay(){
        $from = new \DateTime(date("Y-m-d",time() - 60 * 60 * 24)." 00:00:00");
        $to   = new \DateTime(date("Y-m-d",time() - 60 * 60 * 24)." 23:59:59");
        $statsConnected = $this->doctrine->getRepository("AdministrationAuthenticationBundle:UserConnectionStats")->getConnectionBetweenDate($from,$to);
        $userStat = [];
        if($statsConnected){
            error_log("table : ".print_r($statsConnected, TRUE));
            foreach($statsConnected as $stat){
                $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($stat["userId"]);
                if($user){
                    $userStat[] = Array(
                        "user" => $user,
                        "duree" => $stat["duree"]
                    );
                }
            }
        }
        return $userStat;
    }
}