<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service Workspaces handling Apps
 */
interface WorkspacesAppsInterface
{
    // @getApps get apps for workspace
    public function getApps($workspaceId, $currentUserId = null);

    // @enableApp enable an application by default
    public function enableApp($workspaceId, $applicationId, $currentUserId = null);

    // @disableApp disable an application by default
    public function disableApp($workspaceId, $applicationId, $currentUserId = null);
}