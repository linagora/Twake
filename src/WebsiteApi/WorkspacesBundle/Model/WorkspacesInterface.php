<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service Workspaces
 */
interface WorkspacesInterface
{

	// @getPrivate return user private workspace (create workspace if not exist)
	public function getPrivate($currentUserId);

	// @create creates a new workspace in group
	public function create($name, $groupId = null, $userId = null);

	// @removeWorkspace removes a workspace from a group
	public function remove($groupId, $workspaceId, $currentUserId = null);

	// @changeData set workspace data
	public function changeName($workspaceId, $name, $currentUserId = null);

	// @changeData set workspace data
	public function changeLogo($workspaceId, $logo, $currentUserId = null);

	// @changeData set workspace data
	public function changeWallpaper($workspaceId, $wallpaper, $currentUserId = null);

}