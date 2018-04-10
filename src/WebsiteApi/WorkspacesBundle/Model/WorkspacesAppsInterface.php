<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service Workspaces handling Apps
 */
interface WorkspacesAppsInterface
{
	// @getApps get apps for workspace
	public function getApps($workspaceId, $currentUserId = null);

}