<?php

namespace Twake\Core\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/core/";

    protected $routes = [
        "version" => ["handler" => "Version:getVersion", "methods" => ["GET"]],
        "grouped_query" => ["handler" => "GroupedQuery:query", "methods" => ["POST"]],
        "collections/init" => ["handler" => "Websockets:init", "methods" => ["POST"]],
        "access" => ["handler" => "Access:has_access", "methods" => ["POST"]],
        "workspaceaccess" => ["handler" => "Access:user_has_workspace_access", "methods" => ["POST"]],

        //Remote routes
        "mail" => ["handler" => "Remote:mail", "methods" => ["POST"]],
        "push" => ["handler" => "Remote:push", "methods" => ["POST"]],
        "recaptcha" => ["handler" => "Remote:verifyReCaptcha", "methods" => ["POST"]]

    ];

}