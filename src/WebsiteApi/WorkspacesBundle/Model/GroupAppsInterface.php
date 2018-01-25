<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service GroupApps
 */
interface GroupAppsInterface
{

	// @getApps return list of apps for a group
	public function getApps($groupId, $currentUserId=null);

}