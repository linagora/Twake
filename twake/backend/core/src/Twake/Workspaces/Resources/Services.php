<?php

namespace Twake\Workspaces\Resources;

use Common\BaseServices;

class Services extends BaseServices
{

    protected $services = [
        "app.group_managers" => "GroupManagers",
        "app.groups" => "Groups",
        "app.group_apps" => "GroupApps",
        "app.workspace_levels" => "WorkspaceLevels",
        "app.workspace_members" => "WorkspaceMembers",
        "app.workspaces" => "Workspaces",
        "app.workspaces_activities" => "WorkspacesActivities",
        "app.workspaces_apps" => "WorkspacesApps",
    ];

}