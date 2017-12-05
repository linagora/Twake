<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 28/11/17
 * Time: 14:51
 */
namespace Administration\AuthenticationBundle\Model;


interface AdministrationTwakeUserManagementInterface
{
    //@listTwakeUsers return twake users at the page number $pageNumber with $nbUserByPage
    public function listTwakeUsers($pageNumber,$nbUserByPage,$filters=null,&$total=null);

    //@setEnableTwakeUser block or unblock twake user
    public function setEnableTwakeUser($idTwakeUser,$bool);

    //@getInfoUser return associative array with all user info
    public function getInfoUser($idTwakeUser);
}