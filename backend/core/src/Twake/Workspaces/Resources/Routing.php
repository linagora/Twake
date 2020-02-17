<?php

namespace Twake\Workspaces\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/workspace/";

    protected $routes = [
        "get" => ["handler" => "Workspace:getAction", "methods" => ["POST"]],
        "get_public_data" => ["handler" => "Workspace:getPublicData", "methods" => ["POST"]],
        "create" => ["handler" => "Workspace:create", "methods" => ["POST"]],
        "duplicate" => ["handler" => "Workspace:duplicate", "methods" => ["POST"]],
        "delete" => ["handler" => "Workspace:delete", "methods" => ["POST"]],
        "archive" => ["handler" => "Workspace:archiveWorkspace", "methods" => ["POST"]],
        "unarchive" => ["handler" => "Workspace:unarchiveWorkspace", "methods" => ["POST"]],
        "hideOrNot" => ["handler" => "Workspace:hideOrUnhideWorkspace", "methods" => ["POST"]],
        "favorite" => ["handler" => "Workspace:favoriteOrUnfavoriteWorkspace", "methods" => ["POST"]],
        "notifications" => ["handler" => "Workspace:haveNotificationsOrNotWorkspace", "methods" => ["POST"]],
        "set/isNew" => ["handler" => "Workspace:setIsNew", "methods" => ["POST"]],
# Edit workspace data

        "data/details" => ["handler" => "WorkspaceData:getDetails", "methods" => ["POST"]],
        "data/name" => ["handler" => "WorkspaceData:setName", "methods" => ["POST"]],
        "data/logo" => ["handler" => "WorkspaceData:setLogo", "methods" => ["POST"]],
        "data/wallpaper" => ["handler" => "WorkspaceData:setWallpaper", "methods" => ["POST"]],
        "getByName" => ["handler" => "Workspace:getWorkspaceByName", "methods" => ["POST"]],
# Apps

        "apps/getModuleApps" => ["handler" => "Workspace:getModuleApps", "methods" => ["POST"]],
        "apps/get" => ["handler" => "Workspace:getApps", "methods" => ["POST"]],
        "apps/enable" => ["handler" => "Workspace:enableApp", "methods" => ["POST"]],
        "apps/disable" => ["handler" => "Workspace:disableApp", "methods" => ["POST"]],
# Groups
        "group/getUsers" => ["handler" => "Group:getUsers", "methods" => ["POST"]],
        "group/edit" => ["handler" => "Group:editUser", "methods" => ["POST"]],
        "group/removeUser" => ["handler" => "Group:removeUser", "methods" => ["POST"]],
        "group/data/name" => ["handler" => "Group:changeName", "methods" => ["POST"]],
        "group/data/logo" => ["handler" => "Group:setLogo", "methods" => ["POST"]],
        "group/getWorkspaces" => ["handler" => "Group:getWorkspaces", "methods" => ["POST"]],
        "group/freeOffer" => ["handler" => "Group:runFreeOffer", "methods" => ["POST"]],
        "group/app/use" => ["handler" => "GroupApps:useApp", "methods" => ["POST"]],
        "group/apps/get" => ["handler" => "GroupApps:getApps", "methods" => ["POST"]],
        "group/workspacedefault/set" => ["handler" => "GroupApps:setWorkspaceDefault", "methods" => ["POST"]],
        "group/application/force" => ["handler" => "GroupApps:forceApplication", "methods" => ["POST"]],
        "group/application/remove" => ["handler" => "GroupApps:removeApplication", "methods" => ["POST"]],
        "group/manager/get" => ["handler" => "GroupManager:getManagers", "methods" => ["POST"]],
        "group/manager/add" => ["handler" => "GroupManager:addManagers", "methods" => ["POST"]],
        "group/manager/remove" => ["handler" => "GroupManager:removeManagers", "methods" => ["POST"]],
        "group/manager/edit" => ["handler" => "GroupManager:editManagers", "methods" => ["POST"]],
        "group/manager/toggleManager" => ["handler" => "GroupManager:toggleManager", "methods" => ["POST"]],
# Edit members

        "members/list" => ["handler" => "WorkspaceMembers:getMembers", "methods" => ["POST"]],
        "members/addlist" => ["handler" => "WorkspaceMembers:addList", "methods" => ["POST"]],
        "members/removemail" => ["handler" => "WorkspaceMembers:removeMail", "methods" => ["POST"]],
        "members/remove" => ["handler" => "WorkspaceMembers:removeMembers", "methods" => ["POST"]],
        "members/changelevel" => ["handler" => "WorkspaceMembers:changeMembersLevel", "methods" => ["POST"]],
#Levels

        "levels/list" => ["handler" => "WorkspaceLevels:getLevels", "methods" => ["POST"]],
        "levels/create" => ["handler" => "WorkspaceLevels:createLevel", "methods" => ["POST"]],
        "levels/delete" => ["handler" => "WorkspaceLevels:deleteLevel", "methods" => ["POST"]],
        "levels/edit" => ["handler" => "WorkspaceLevels:editLevel", "methods" => ["POST"]],
        "levels/default" => ["handler" => "WorkspaceLevels:makeDefaulLevel", "methods" => ["POST"]],
        "levels/getByLabel" => ["handler" => "WorkspaceLevels:getByLabel", "methods" => ["POST"]],
        "members/getWorkspaces" => ["handler" => "WorkspaceMembers:getWorkspaces", "methods" => ["POST"]],
    ];

}