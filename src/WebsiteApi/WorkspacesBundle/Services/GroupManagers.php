<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Model\GroupManagersInterface;

class GroupManagers implements GroupManagersInterface
{

	public function getLevel($groupId, $userId, $currentUser = null)
	{
		// TODO: Implement getLevel() method.
	}

	public function changeLevel($groupId, $userId, $level, $currentUser = null)
	{
		// TODO: Implement changeLevel() method.
	}

	public function addManager($groupId, $userId, $level, $currentUser = null)
	{
		// TODO: Implement addManager() method.
	}

	public function removeManager($groupId, $userId, $currentUser = null)
	{
		// TODO: Implement removeManager() method.
	}

	public function getManagers($groupId, $currentUser = null)
	{
		// TODO: Implement getManagers() method.
	}

	public function getGroups($userId)
	{
		// TODO: Implement getGroups() method.
	}
}