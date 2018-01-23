<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service WorkspaceMembers
 *
 * This service manage members of a workspace
 */
interface WorkspaceMembersInterface
{

	// @changeLevel change user level in workspace
	public function changeLevel($workspaceId, $userId, $level, $currentUserId=null);

	// @addMember add user in workspace as member
	public function addMember($workspaceId, $userId, $level, $currentUserId=null);

	// @removeMember remove member from workspace
	public function removeMember($workspaceId, $userId, $currentUserId=null);

	// @getMembers returns members for workspace ([{user: OBJECT, level: OBJECT}])
	public function getMembers($workspaceId, $currentUserId=null);

	// @getWorkspaces returns workspaces of an user
	public function getWorkspaces($userId);

}