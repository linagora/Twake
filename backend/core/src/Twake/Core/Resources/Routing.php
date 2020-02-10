<?php

namespace Twake\Core\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "";

    protected $routes = [
        "ajax/core/version" => ["handler" => "Version:getVersion", "methods" => ["GET"]],
        "ajax/core/grouped_query" => ["handler" => "GroupedQuery:query", "methods" => ["POST"]],
        "ajax/core/collections/init" => ["handler" => "Websockets:init", "methods" => ["POST"]],
        "ajax/core/access" => ["handler" => "Access:has_access", "methods" => ["POST"]],
        "ajax/core/workspaceaccess" => ["handler" => "Access:user_has_workspace_access", "methods" => ["POST"]],

        //Remote routes
        "api/remote/mail" => ["handler" => "Remote:mail", "methods" => ["POST"]],
        "api/remote/push" => ["handler" => "Remote:push", "methods" => ["POST"]],
        "api/remote/recaptcha" => ["handler" => "Remote:verifyReCaptcha", "methods" => ["POST"]]

    ];

}