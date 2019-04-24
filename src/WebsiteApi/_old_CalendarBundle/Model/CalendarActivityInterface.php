<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 25/06/18
 * Time: 09:26
 */

namespace WebsiteApi\_old_CalendarBundle\Model;


interface CalendarActivityInterface
{

    // @pushNotification add new notification
    public function pushActivity($pushNotif = true, $workspace, $users = null, $levels = null, $texte = null, $type = Array());

    // @readAll remove all notifications for this
    public function readAll($workspace, $user);

    // @getAll return list of notifications for an user
    public function getAll($user);

}