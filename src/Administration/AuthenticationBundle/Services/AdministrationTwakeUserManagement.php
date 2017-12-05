<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 28/11/17
 * Time: 14:56
 */

namespace Administration\AuthenticationBundle\Services;


use Administration\AuthenticationBundle\Model\AdministrationTwakeUserManagementInterface;
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
        return $repository->search($pageNumber,$nbUserByPage,$filters,$total);
    }



    public function setEnableTwakeUser($idTwakeUser,$bool)
    {
        $em = $this->doctrine;
        $repository = $em->getRepository("TwakeUsersBundle:User");
        $twakeUser =  $repository->findOnBy(Array("id"=>$idTwakeUser));
        $twakeUser->setEnabled($bool);
        $em->persist($twakeUser);
        $em->flush($twakeUser);
        return $twakeUser;
    }
    public function getInfoUser($idTwakeUser){
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        $twakeUser =  $repository->findOnBy(Array("id"=>$idTwakeUser));

    }


}