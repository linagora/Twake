<?php

namespace AdministrationApi\Group\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/backend/group/";

    protected $routes = [

        "getgroup" => ["handler" => "Group:getAllGroup", "methods" => ["POST"]],
        "getwp" => ["handler" => "Group:getAllWorkspace", "methods" => ["POST"]],
        "getgroupbyname" => ["handler" => "Group:getGroupbyname", "methods" => ["POST"]],
        "getwpbyname" => ["handler" => "Group:getWpbyname", "methods" => ["POST"]],
        "getuserbymail" => ["handler" => "Group:getUserbyMail", "methods" => ["POST"]],
    ];

}