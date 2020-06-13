<?php

namespace AdministrationApi\Workspaces\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/backend/workspaces/";

    protected $routes = [
        "getGroups" => ["handler" => "Groups:getAllGroups", "methods" => ["POST"]],
        "getOneGroup" => ["handler" => "Groups:getOneGroup", "methods" => ["POST"]],
        "getAllWorkspaces" => ["handler" => "Workspaces:getAllWorkspaces", "methods" => ["POST"]],
        "getWorkspace" => ["handler" => "Workspaces:getOneWorkspace", "methods" => ["POST"]],
        "searchGroups" => ["handler" => "Groups:findGroups", "methods" => ["POST"]],
    ];

}