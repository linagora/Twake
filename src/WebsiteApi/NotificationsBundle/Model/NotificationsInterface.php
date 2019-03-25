<?php

namespace WebsiteApi\NotificationsBundle\Model;

/**
 * This is an interface for the service User
 *
 * This service is responsible for subscribtions, unsubscribtions, request for new password
 */
interface NotificationsInterface
{

	// @pushNotification add new notification
    public function pushNotification(
        $application = null,
        $sender_application = null,
        $sender_user = null,
        $workspace = null,
        $channel = null,
        $users = null,
        $code = null,
        $text = null,
        $shortcut = null,
        $additionnal_data = Array(),
        $type = Array(),
        $save_notification = true
    );

	// @readAll remove all notifications for this
    public function readAll($user);

	// @getAll return list of notifications for an user
	public function getAll($user);

}