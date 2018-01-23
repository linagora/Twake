<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service WorkspaceLevels
 *
 * This service manage levels of a workspace
 */
interface WorkspaceLevelsInterface
{

	// @updateLevel change a level in workspace
	public function updateLevel($workspaceId, $levelId, $label, $rights, $currentUserId=null);

	// @addLevel add level in workspace
	public function addLevel($workspaceId, $label, $rights, $currentUserId=null);

	// @removeLevel remove level from workspace
	public function removeLevel($workspaceId, $levelId, $currentUserId=null);

	// @getUsers returns users having this level
	public function getUsers($workspaceId, $levelId, $currentUserId=null);

	// @getLevels returns levels list in workspace
	public function getLevels($workspaceId, $currentUserId=null);

	// @getLevel get user level in workspace and returns null il no level (not a member)
	public function getLevel($workspaceId, $userId, $currentUserId=null);

}