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
	public function create($userId, $name, $uniquename, $planId);

	// @changeData set group data
	public function changeData($groupId, $name, $thumbnailFile, $currentUser = null);

	// @changePlan set a plan id for a group
	public function changePlan($groupId, $planId, $currentUser = null);

	// @removeUserFromGroup remove an user from all workspaces of this group
	public function removeUserFromGroup($groupId, $userId, $currentUser = null);

	// @isInGroup returns true if user is in a workspace of this group
	public function isInGroup($groupId, $userId);

	// @getWorkspaces returns all workspaces for this group
	public function getWorkspaces($groupId, $userId);

	// @getUsers returns all members for this group without repetition
	public function getUsers($groupId, $userId);

}