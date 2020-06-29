<?php

namespace Twake\Workspaces\Resources;

use Common\BaseServices;

class Services extends BaseServices
{

    protected $services = [
        "app.group_managers" => "GroupManagers",
//        arguments: ["@app.twake_doctrine", "@app.twake_mailer", "@app.pusher"]
        "app.groups" => "Groups",
//        arguments: ["@app.twake_doctrine", "@app.group_managers","@app.applications","@app.string_cleaner","@app.group_period","@app.workspace_members", "@app.pusher"]
        "app.group_apps" => "GroupApps",
//        arguments: ["@app.twake_doctrine", "@app.group_managers", "@app.workspaces_apps"]
        "app.group_period" => "GroupPeriods",
//        arguments: ["@app.twake_doctrine"]
        "app.pricing_plan" => "PricingPlan",
//        arguments: ["@app.twake_doctrine","@app.group_period"]
        "app.workspace_levels" => "WorkspaceLevels",
//        arguments: ["@app.twake_doctrine", "@app.pusher"]
        "app.workspace_members" => "WorkspaceMembers",
//        arguments: ["@app.twake_doctrine", "@app.workspace_levels", "@app.twake_mailer", "@app.string_cleaner","@app.pusher","@app.pricing_plan", "@app.calendar.calendar", '@app.workspaces_activities', '@app.group_managers']
        "app.workspaces" => "Workspaces",
//        arguments: ["@app.twake_doctrine", "@app.workspace_levels", "@app.workspace_members", "@app.group_managers", "@app.group_apps", "@app.groups", "@app.pricing_plan","@app.string_cleaner","@app.pusher",'@app.workspaces_activities','@app.translate','@app.calendar.calendar','@app.calendar.event', "@app.workspaces_apps"]
        "app.workspaces_activities" => "WorkspacesActivities",
//        arguments: ["@app.twake_doctrine", '@app.applications']
        "app.workspaces_apps" => "WorkspacesApps",
//        arguments: ["@app.twake_doctrine", "@app.workspace_levels","@app.group_managers","@app.pusher", "@app.channels.channels_system", "@app.applications_api"]
    ];

}