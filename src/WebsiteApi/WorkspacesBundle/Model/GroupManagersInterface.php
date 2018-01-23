<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service GroupManagers
 */
interface GroupManagersInterface
{

	// @getLevel get user level in group and returns null il no level (not a manager)
	public function getLevel($groupId, $userId, $currentUser=null);

	// @changeLevel change user level in group
	public function changeLevel($groupId, $userId, $level, $currentUser=null);

	// @addManager add user in group as manager
	public function addManager($groupId, $userId, $level, $currentUser=null);

	// @removeManager remove manager from group
	public function removeManager($groupId, $userId, $currentUser=null);

	// @getManagers returns managers for group ([{user: OBJECT, level: OBJECT}])
	public function getManagers($groupId, $currentUser=null);

	// @getGroups returns groups managed by an user
	public function getGroups($userId);

}