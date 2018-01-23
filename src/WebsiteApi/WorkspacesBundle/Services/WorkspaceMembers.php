<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Model\WorkspaceMembersInterface;

class WorkspaceMembers implements WorkspaceMembersInterface
{

	public function changeLevel($workspaceId, $userId, $level, $currentUser = null)
	{
		// TODO: Implement changeLevel() method.
	}

	public function addMember($workspaceId, $userId, $level, $currentUser = null)
	{
		// TODO: Implement addMember() method.
	}

	public function removeMember($workspaceId, $userId, $currentUser = null)
	{
		// TODO: Implement removeMember() method.
	}

	public function getMembers($workspaceId, $currentUser = null)
	{
		// TODO: Implement getMembers() method.
	}

	public function getWorkspaces($userId)
	{
		// TODO: Implement getWorkspaces() method.
	}
}