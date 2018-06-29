<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 25/06/18
 * Time: 09:26
 */

namespace WebsiteApi\DriveBundle\Model;


interface DriveActivityInterface
{

    // @pushNotification add new notification
    public function pushActivity($pushNotif, $workspace, $users = null, $levels = null, $text = null, $type = Array());

    // @readAll remove all notifications for this
    public function readAll($application, $workspace, $user);

    // @getAll return list of notifications for an user
    public function getAll($user);

}