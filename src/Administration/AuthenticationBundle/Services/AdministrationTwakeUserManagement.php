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

    public function listTwakeUsers($pageNumber, $nbUserByPage, $filters = null, &$total=null)
    {
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        return $repository->findAllOrderedByName($pageNumber,$nbUserByPage,$filters,$total);
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

    public function getUserWorkspace($idTwakeUser){
        $repository = $this->doctrine->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser");
        $linkWorkspaceUser = $repository->findBy(Array("User"=>$idTwakeUser));
        return $linkWorkspaceUser->getGroup();
    }


}