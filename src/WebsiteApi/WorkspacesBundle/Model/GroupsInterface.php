<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service Groups
 *
 * This services manage groups which are companies and contain workspaces.
 * A group is defined by
 * - an unique name,  a display name and a logo
 * - a pricing plan
 * - some workspaces
 * - managers users
 */
interface GroupsInterface
{

	// @create creates a new group
	public function create($name, $uniquename, $plan);

	// @changeData set group data
	public function changeData($groupId, $userId, $name, $thumbnailFile);

	// @changePlan set a plan id for a group
	public function changePlan($groupId, $userId, $planId);

	// @addManager add a new manager on this group
	public function addManager($groupId, $userId, $addedUserId);

	// @removeManager remove a manager from this group
	public function removeManager($groupId, $userId, $removedUserId);

	// @removeUserFromGroup remove an user from all workspaces of this group
	public function removeUserFromGroup($groupId, $userId, $removedUserId);

	// @addWorkspace creates a new workspace in a group
	public function addWorkspace($groupId, $userId, $name);

	// @removeWorkspace removes a workspace from a group
	public function removeWorkspace($groupId, $userId, $workspaceId);

	// @isInGroup returns true if user is in group
	public function isInGroup($groupId, $userId);

	// @getWorkspaces returns all workspaces for this group
	public function getWorkspaces($groupId, $userId);

	// @getUsers returns all members for this group without repetition
	public function getUsers($groupId, $userId);

}