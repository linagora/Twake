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
	public function pushNotification($application, $workplace, $users=null, $levels=null, $code=null, $texte=null, $type=Array());

	// @readAll remove all notifications for this
	public function readAll($application, $workplace, $user);

	// @getAll return list of notifications for an user
	public function getAll($user);

}