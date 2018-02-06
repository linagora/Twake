<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service GroupManagers
 */
interface GroupManagersInterface
{

	// @hasPrivileges return boolean if privilege is in privileges
	public function hasPrivileges($level, $privilege);

	// @getPrivileges return array of privileges for user
	public function getPrivileges($level);

	// @getLevel get user level in group and returns null il no level (not a manager)
	public function getLevel($groupId, $userId, $currentUserId=null);

	// @changeLevel change user level in group
	public function changeLevel($groupId, $userId, $level, $currentUserId=null);

	// @addManager add user in group as manager
	public function addManager($groupId, $userId, $level, $currentUserId=null);

	// @removeManager remove manager from group
	public function removeManager($groupId, $userId, $currentUserId=null);

	// @getManagers returns managers for group ([{user: OBJECT, level: INT}])
	public function getManagers($groupId, $currentUserId=null);

	// @getGroups returns groups managed by an user ([{group: OBJECT, level: INT}])
	public function getGroups($userId);

}