<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Model\WorkspaceMembersInterface;

class WorkspaceMembers implements WorkspaceMembersInterface
{

	public function __construct($doctrine)
	{
		$this->doctrine = $doctrine;
	}

	public function changeLevel($workspaceId, $userId, $level, $currentUserId = null)
	{
		// TODO: Implement changeLevel() method.
	}

	public function addMember($workspaceId, $userId, $level, $currentUserId = null)
	{
		// TODO: Implement addMember() method.
	}

	public function removeMember($workspaceId, $userId, $currentUserId = null)
	{
		// TODO: Implement removeMember() method.
	}

	public function getMembers($workspaceId, $currentUserId = null)
	{
		// TODO: Implement getMembers() method.
	}

	public function getWorkspaces($userId)
	{
		// TODO: Implement getWorkspaces() method.
	}
}