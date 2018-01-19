<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 05/12/17
 * Time: 16:54
 */

namespace Administration\AuthenticationBundle\Model;


interface AdministrationGroupManagementInterface
{
    public function listGroup($pageNumber,$nbUserByPage,$filters=null,&$total);

    //@getInfoUser return associative array with all user info
    public function getInfoWorkspace($idTwakeWorkspace);

    //searchUser return array with all twake user order by infos
    public function searchWorkspace($pageNumber, $nbWorkspaceByPage,$lastName=null,$firstName=null,$userName=null,$email=null,&$total=null);

    //sizeWorkspace get the $idTwakeWorkspace size
    public function sizeWorkspace($idTwakeWorkspace);

    //getWorkspaceMembers return all the workspaceMembers
    public function getWorkspaceMembers($idTwakeWorkspace);

}