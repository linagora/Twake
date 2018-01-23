<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service Workspaces
 */
interface WorkspacesInterface
{

	// @getPrivate return user private workspace (create workspace if not exist)
	public function getPrivate($currentUserId = null);

	// @create creates a new workspace in group
	public function create($groupId, $name, $currentUserId = null);

	// @removeWorkspace removes a workspace from a group
	public function remove($groupId, $workspaceId, $currentUserId = null);

	// @changeData set workspace data
	public function changeData($name, $thumbnailFile, $currentUserId = null);

}