<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Model\GroupsInterface;

class Groups implements GroupsInterface
{

	public function create($userId, $name, $uniquename, $planId)
	{
		// TODO: Implement create() method.
	}

	public function changeData($groupId, $name, $thumbnailFile, $currentUser = null)
	{
		// TODO: Implement changeData() method.
	}

	public function changePlan($groupId, $planId, $currentUser = null)
	{
		// TODO: Implement changePlan() method.
	}

	public function removeUserFromGroup($groupId, $userId, $currentUser = null)
	{
		// TODO: Implement removeUserFromGroup() method.
	}

	public function isInGroup($groupId, $userId)
	{
		// TODO: Implement isInGroup() method.
	}

	public function getWorkspaces($groupId, $userId)
	{
		// TODO: Implement getWorkspaces() method.
	}

	public function getUsers($groupId, $userId)
	{
		// TODO: Implement getUsers() method.
	}
}