<?php

namespace WebsiteApi\UsersBundle\Services;
use WebsiteApi\UsersBundle\Model\UserStatsInterface;

/**
 * This is an interface for the service UserStats
 *
 * This service is responsible for recording data from user for statistical purpose only
 */
class UserStats implements UserStatsInterface
{

	protected $em;

	public function __construct($em)
	{
		$this->em = $em;
	}

	public function login($userId)
	{
		// TODO: Implement login() method.
	}

	public function sendMessage($userId)
	{
		// TODO: Implement sendMessage() method.
	}

	public function addFile($userId, $size)
	{
		// TODO: Implement addFile() method.
	}

	public function downloadFile($userId)
	{
		// TODO: Implement downloadFile() method.
	}

	public function openApp($userId, $appId)
	{
		// TODO: Implement openApp() method.
	}

	public function openWorkspace($userId, $workspaceId)
	{
		// TODO: Implement openWorkspace() method.
	}
}