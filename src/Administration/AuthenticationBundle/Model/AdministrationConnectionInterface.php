<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 17/01/18
 * Time: 10:44
 */

namespace Administration\AuthenticationBundle\Model;


interface AdministrationConnectionInterface
{
    public function newConnection($idTwakeUser);

    public function closeConnection($idTwakeUser);

}