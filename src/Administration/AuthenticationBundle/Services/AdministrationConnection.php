<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 17/01/18
 * Time: 10:45
 */

namespace Administration\AuthenticationBundle\Services;

use Administration\AuthenticationBundle\Model\AdministrationDailyConnectionInterfaceInterface;
use WebsiteApi\WorkspacesBundle\Entity\UserDailyStats;


class AdministrationConnection
{
    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function newConnection($idTwakeUser)
    {
        $em = $this->doctrine;
        $adminUserRepo  = $em->getRepository("AdministrationAuthenticationBundle:UserConnectionStats"); //Entity Repository
        $repo  = $em->getRepository("TwakeUsersBundle:User"); //Entity Repository

        $twakeUser = $repo->findOneBy(Array("id"=>$idTwakeUser));
        if($twakeUser == null){
            return null;
        }

        $connection = new UserDailyStats();
        $connection-> setUser($twakeUser);
        $connection-> setDateConnection(new \DateTime("now"));
        $em->persist($connection);
        $em->flush();

    }
}