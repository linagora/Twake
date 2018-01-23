<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\WorkspacesBundle\Model\WorkspaceLevelsInterface;

class WorkspaceLevels implements WorkspaceLevelsInterface
{

	public function updateLevel($workspaceId, $levelId, $label, $rights, $currentUser = null)
	{
		// TODO: Implement updateLevel() method.
	}

	public function addLevel($workspaceId, $label, $rights, $currentUser = null)
	{
		// TODO: Implement addLevel() method.
	}

	public function removeLevel($workspaceId, $levelId, $currentUser = null)
	{
		// TODO: Implement removeLevel() method.
	}

	public function getUsers($workspaceId, $levelId, $currentUser = null)
	{
		// TODO: Implement getUsers() method.
	}

	public function getLevels($workspaceId, $currentUser = null)
	{
		// TODO: Implement getLevels() method.
	}

	public function getLevel($workspaceId, $userId, $currentUser = null)
	{
		// TODO: Implement getLevel() method.
	}
}