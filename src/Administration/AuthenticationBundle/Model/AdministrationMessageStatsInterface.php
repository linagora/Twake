<?php
/**
 * Created by PhpStorm.
 * User: founski
 * Date: 17/01/18
 * Time: 10:44
 */

namespace Administration\AuthenticationBundle\Model;


interface AdministrationMessageStatsInterface
{
    //countDailyMessage count the number of message sent by the $idTwakeUser
    public function countDailyMessage($iTwakedUser);
}