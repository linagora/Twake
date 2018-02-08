<?php


namespace WebsiteApi\NotificationsBundle\Services;
use WebsiteApi\NotificationsBundle\Model\NotificationsInterface;

/**
 * Class Notifications
 * @package WebsiteApi\UsersBundle\Services
 *
 * Gestion des notifications
 */
class Notifications implements NotificationsInterface
{

	var $doctrine;
	public function __construct($doctrine){
		$this->doctrine = $doctrine;
	}

	public function pushNotification($application, $workplace, $users = null, $levels = null, $code = null, $texte = null, $type = Array())
	{
		//TODO
	}

	public function readAll($application, $workplace, $user)
	{
		// TODO: Implement readAll() method.
	}

	public function getAll($user)
	{
		// TODO: Implement getAll() method.
	}
}
