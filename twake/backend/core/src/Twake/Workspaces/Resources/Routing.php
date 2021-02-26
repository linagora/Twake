<?php

namespace Twake\Workspaces\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/workspace/";

    protected $routes = [
        "get" => ["handler" => "Workspace:getAction", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "get_public_data" => ["handler" => "Workspace:getPublicData", "methods" => ["POST"]],
        "create" => ["handler" => "Workspace:create", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "duplicate" => ["handler" => "Workspace:duplicate", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "delete" => ["handler" => "Workspace:delete", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "archive" => ["handler" => "Workspace:archiveWorkspace", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "unarchive" => ["handler" => "Workspace:unarchiveWorkspace", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "hideOrNot" => ["handler" => "Workspace:hideOrUnhideWorkspace", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "favorite" => ["handler" => "Workspace:favoriteOrUnfavoriteWorkspace", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "notifications" => ["handler" => "Workspace:haveNotificationsOrNotWorkspace", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "set/isNew" => ["handler" => "Workspace:setIsNew", "methods" => ["POST"], "security" => ["user_connected_security"]],
# Edit workspace data

        "data/name" => ["handler" => "WorkspaceData:setName", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "data/logo" => ["handler" => "WorkspaceData:setLogo", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "data/wallpaper" => ["handler" => "WorkspaceData:setWallpaper", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "getByName" => ["handler" => "Workspace:getWorkspaceByName", "methods" => ["POST"], "security" => ["user_connected_security"]],
# Apps

        "apps/getModuleApps" => ["handler" => "Workspace:getModuleApps", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "apps/get" => ["handler" => "Workspace:getApps", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "apps/enable" => ["handler" => "Workspace:enableApp", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "apps/disable" => ["handler" => "Workspace:disableApp", "methods" => ["POST"], "security" => ["user_connected_security"]],
# Groups
        "group/getUsers" => ["handler" => "Group:getUsers", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/edit" => ["handler" => "Group:editUser", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/removeUser" => ["handler" => "Group:removeUser", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/data/name" => ["handler" => "Group:changeName", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/data/logo" => ["handler" => "Group:setLogo", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/getWorkspaces" => ["handler" => "Group:getWorkspaces", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/app/use" => ["handler" => "GroupApps:useApp", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/apps/get" => ["handler" => "GroupApps:getApps", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/workspacedefault/set" => ["handler" => "GroupApps:setWorkspaceDefault", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/application/force" => ["handler" => "GroupApps:forceApplication", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/application/remove" => ["handler" => "GroupApps:removeApplication", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/manager/get" => ["handler" => "GroupManager:getManagers", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/manager/add" => ["handler" => "GroupManager:addManagers", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/manager/remove" => ["handler" => "GroupManager:removeManagers", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/manager/edit" => ["handler" => "GroupManager:editManagers", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "group/manager/toggleManager" => ["handler" => "GroupManager:toggleManager", "methods" => ["POST"], "security" => ["user_connected_security"]],
# Edit members

        "members/list" => ["handler" => "WorkspaceMembers:getMembers", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "members/pending" => ["handler" => "WorkspaceMembers:getPending", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "members/addlist" => ["handler" => "WorkspaceMembers:addList", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "members/removemail" => ["handler" => "WorkspaceMembers:removeMail", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "members/remove" => ["handler" => "WorkspaceMembers:removeMembers", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "members/changelevel" => ["handler" => "WorkspaceMembers:changeMembersLevel", "methods" => ["POST"], "security" => ["user_connected_security"]],
#Levels

        "levels/list" => ["handler" => "WorkspaceLevels:getLevels", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "levels/create" => ["handler" => "WorkspaceLevels:createLevel", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "levels/delete" => ["handler" => "WorkspaceLevels:deleteLevel", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "levels/edit" => ["handler" => "WorkspaceLevels:editLevel", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "levels/default" => ["handler" => "WorkspaceLevels:makeDefaulLevel", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "levels/getByLabel" => ["handler" => "WorkspaceLevels:getByLabel", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "members/getWorkspaces" => ["handler" => "WorkspaceMembers:getWorkspaces", "methods" => ["POST"], "security" => ["user_connected_security"]],
    ];

}
