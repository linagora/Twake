<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 17/01/18
 * Time: 10:45
 */

namespace Administration\AuthenticationBundle\Services;

use Administration\AuthenticationBundle\Model\AdministrationDailyConnectionInterfaceInterface;
use Administration\AuthenticationBundle\Entity\UserConnectionStats;


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

        $connection = new UserConnectionStats();
        $connection-> setUser($twakeUser);
        $connection-> setDateConnection(new \DateTime("now"));
        $connection->setDureeConnection(0);
        $em->persist($connection);
        $em->flush();

    }

    public function closeConnection($idTwakeUser)
    {
        $em = $this->doctrine;
        $connectionRepo  = $em->getRepository("AdministrationAuthenticationBundle:UserConnectionStats"); //Entity Repository
        $repo  = $em->getRepository("TwakeUsersBundle:User"); //Entity Repository

        //on verifie que l'user existe
        $twakeUser = $repo->findOneBy(Array("id"=>$idTwakeUser));
        if($twakeUser == null){
            return null;
        }

        //on verifie qu'il y'a une ligne qui correspond à sa connexion
        $connection = $connectionRepo->findOneBy(Array("user"=>$idTwakeUser,"dureeConnection"=>0));
        if($connection == null)
        {
            return null;
        }

        //calcul du temps de connection
        $duree = ((new \DateTime("now"))->getTimestamp()-$connection->getDateConnection()->getTimestamp());

        $connection->setDureeConnection($duree);
        $em->persist($connection);
        $em->flush();
    }
}