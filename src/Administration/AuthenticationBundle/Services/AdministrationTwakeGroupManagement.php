<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 05/12/17
 * Time: 16:55
 */

namespace Administration\AuthenticationBundle\Services;


class AdministrationTwakeGroupManagement
{
    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function listGroup($pageNumber,$nbGroupByPage,$filters=null,&$total){
        $repository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        return $repository->search($pageNumber,$nbGroupByPage,$filters,$total);
    }

    public function getInfoWorkspace($idTwakeWorkspace)
    {
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        $twakeWorkspace =  $repository->findOneBy(Array("id"=>$idTwakeWorkspace));
        if($twakeWorkspace == null)
        {
            return null;
        }
        return $twakeWorkspace;
    }

    public function searchWorkspace($pageNumber, $nbWorkspaceByPage,$lastName=null,$firstName=null,$userName=null,$email=null,&$total=null){
        $repository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        return $repository->findUsersByFilter($pageNumber, $nbWorkspaceByPage,$lastName,$firstName,$userName,$email,$total);
    }
}