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

	public function countWorkspace(){
		$qb = $this->doctrine->createQueryBuilder();
		$qb->select($qb->expr()->count('w'))
			->from('TwakeWorkspacesBundle:Workspace', 'w')
            ->where('w.is_deleted = 0');
		$query = $qb->getQuery();
		return $query->getSingleScalarResult();
	}

	public function countGroup(){
		$qb = $this->doctrine->createQueryBuilder();
		$qb->select($qb->expr()->count('g'))
			->from('TwakeWorkspacesBundle:Group', 'g');
		$query = $qb->getQuery();
		return $query->getSingleScalarResult();
	}

    public function listGroup($pageNumber,$nbGroupByPage,$filter=null,&$total){
        $repository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        return Array();
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
        return Array();
    }

    public function sizeWorkspace($idTwakeWorkspace){
        return $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->sumSize(getInfoWorkspace($idTwakeWorkspace));
    }

    public function getWorkspaceMembers($idTwakeWorkspace){
        return $this->getInfoWorkspace($idTwakeWorkspace)->getMembers();
    }


}