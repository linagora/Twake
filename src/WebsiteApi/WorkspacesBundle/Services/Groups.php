<?php

namespace WebsiteApi\WorkspacesBundle\Services;
use WebsiteApi\WorkspacesBundle\Model\GroupsInterface;

/**
 * This services manage groups which are companies and contain workspaces.
 * A group is defined by
 * - an unique name,  a display name and a logo
 * - a pricing plan
 * - some workspaces
 * - managers users
 */
class Groups implements GroupsInterface
{

	public function create($name, $uniquename, $plan)
	{
		// TODO: Implement create() method.
	}

	public function changeData($groupId, $userId, $name, $thumbnailFile)
	{
		// TODO: Implement changeData() method.
	}

	public function changePlan($groupId, $userId, $planId)
	{
		// TODO: Implement changePlan() method.
	}

	public function addManager($groupId, $userId, $addedUserId)
	{
		// TODO: Implement addManager() method.
	}

	public function removeManager($groupId, $userId, $removedUserId)
	{
		// TODO: Implement removeManager() method.
	}

	public function removeUserFromGroup($groupId, $userId, $removedUserId)
	{
		// TODO: Implement removeUserFromGroup() method.
	}

	public function addWorkspace($groupId, $userId, $name)
	{
		// TODO: Implement addWorkspace() method.
	}

	public function removeWorkspace($groupId, $userId, $workspaceId)
	{
		// TODO: Implement removeWorkspace() method.
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