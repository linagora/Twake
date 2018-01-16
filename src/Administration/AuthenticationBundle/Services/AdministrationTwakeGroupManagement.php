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
        $repository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $twakeWorkspace =  $repository->findOneBy(Array("id"=>$idTwakeWorkspace));
        if($twakeWorkspace == null)
        {
            return null;
        }
        return $twakeWorkspace;
    }

    public function searchWorkspace($pageNumber,$nbWorkspaceByPage,$name=null,$memberCount=null,&$total=null){
        $repository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        return $repository->findWorspaceByFilter($pageNumber, $nbWorkspaceByPage,$name,$memberCount,$total);
    }

    public function sizeWorkspace($idTwakeWorkspace){
        return $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->sumSize(getInfoWorkspace($idTwakeWorkspace));
    }

    public function getWorkspaceMembers($idTwakeWorkspace){
        return $this->getInfoWorkspace($idTwakeWorkspace)->getMembers();
    }

}