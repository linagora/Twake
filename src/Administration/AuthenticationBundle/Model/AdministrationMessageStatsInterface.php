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
    //countDailyMessage count the number of message sent by the $idTwakeUser (trigger websocket)
    public function countDailyMessage($iTwakedUser);

    //countDailyMessageByWorkspace count the number of public message sent in $idWorkspace (trigger websocket)
    public function countDailyMessageByWorkspace($idWorkspace);

    //countPublicMessage count the number of public message sent by the $idTwakeUser between $startdate and $enddate
    public function countPublicMessage($idTwakeUser,$startdate,$enddate);

    //countPrivateMessage count the number of private message sent by the $idTwakeUser between $startdate and $enddate
    public function countPrivateMessage($idTwakeUser,$startdate,$enddate);

    //numberOfMessagePrivateByUserByWorkspace count the number of private message sent by the $idTwakeUser in $idWorkSpace between $startdate and $enddate
    public function numberOfMessagePrivateByUserByWorkspace($idWorkSpace,$startdate,$enddate);

    //numberOfMessagePrivateByUserByWorkspace count the number of public message sent in $idWorkSpace between $startdate and $enddate
    public function numberOfMessagePublicByWorkspace($idWorkSpace,$startdate,$enddate);
}