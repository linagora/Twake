<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 15/01/18
 * Time: 10:32
 */

namespace Administration\AuthenticationBundle\Services;


use Administration\AuthenticationBundle\Model\AdministrationStatisticsInterface;

class AdministrationStatistics implements AdministrationStatisticsInterface
{
    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }
    public function numberOfUserCurrentlyConnected(){
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        return $repository->countUsersConnected();
    }
    public function numberOfUsers(){
        $repository = $this->doctrine->getRepository("TwakeUsersBundle:User");
        return $repository->countUsers();
    }
}