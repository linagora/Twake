<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service Workspaces
 */
interface WorkspacesInterface
{

	// @getPrivate return user private workspace (create workspace if not exist)
	public function getPrivate($currentUser = null);

	// @create creates a new workspace in group
	public function create($groupId, $name, $currentUser = null);

	// @removeWorkspace removes a workspace from a group
	public function remove($groupId, $workspaceId, $currentUser = null);

	// @changeData set workspace data
	public function changeData($name, $thumbnailFile, $currentUser = null);

}