<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service GroupApps
 */
interface GroupAppsInterface
{

	// @getApps return list of apps for a group
	public function getApps($groupId, $currentUserId=null);

	// @setWorkspaceDefault set workspaceDefault for an application
    public function setWorkspaceDefault($groupId, $appId, $boolean, $currentUserId = null);

    // @RemoveApplication the given application
    public function RemoveApplication($groupId, $appId, $currentUserId = null);
}