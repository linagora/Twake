<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\WorkspacesBundle\Model\WorkspaceLevelsInterface;

class WorkspaceLevels implements WorkspaceLevelsInterface
{

	public function __construct($doctrine)
	{
		$this->doctrine = $doctrine;
	}

	public function updateLevel($workspaceId, $levelId, $label, $rights, $currentUserId = null)
	{
		// TODO: Implement updateLevel() method.
	}

	public function addLevel($workspaceId, $label, $rights, $currentUserId = null)
	{
		// TODO: Implement addLevel() method.
	}

	public function removeLevel($workspaceId, $levelId, $currentUserId = null)
	{
		// TODO: Implement removeLevel() method.
	}

	public function getUsers($workspaceId, $levelId, $currentUserId = null)
	{
		// TODO: Implement getUsers() method.
	}

	public function getLevels($workspaceId, $currentUserId = null)
	{
		// TODO: Implement getLevels() method.
	}

	public function getLevel($workspaceId, $userId, $currentUserId = null)
	{
		// TODO: Implement getLevel() method.
	}
}