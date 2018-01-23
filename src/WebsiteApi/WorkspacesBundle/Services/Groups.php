<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Model\GroupsInterface;

class Groups implements GroupsInterface
{

	public function __construct($doctrine)
	{
		$this->doctrine = $doctrine;
	}

	public function create($userId, $name, $uniquename, $planId)
	{
		// TODO: Implement create() method.
	}

	public function changeData($groupId, $name, $thumbnailFile, $currentUserId = null)
	{
		// TODO: Implement changeData() method.
	}

	public function changePlan($groupId, $planId, $currentUserId = null)
	{
		// TODO: Implement changePlan() method.
	}

	public function removeUserFromGroup($groupId, $userId, $currentUserId = null)
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