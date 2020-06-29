<?php

namespace Twake\Tasks\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/tasks/";

    protected $routes = [
#Tasks
        "task/get" => ["handler" => "Task:getAction", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "task/save" => ["handler" => "Task:save", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "task/remove" => ["handler" => "Task:remove", "methods" => ["POST"], "security" => ["user_connected_security"]],
#Lists
        "list/get" => ["handler" => "BoardList:getAction", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "list/save" => ["handler" => "BoardList:save", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "list/remove" => ["handler" => "BoardList:remove", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "list/tasks/remove" => ["handler" => "BoardList:removeAll", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "list/tasks/archive" => ["handler" => "BoardList:archiveAll", "methods" => ["POST"], "security" => ["user_connected_security"]],
#Boards
        "board/get" => ["handler" => "Board:getAction", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "board/save" => ["handler" => "Board:save", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "board/remove" => ["handler" => "Board:remove", "methods" => ["POST"], "security" => ["user_connected_security"]],
#Export
        "export" => ["handler" => "Export:export", "methods" => ["POST", "GET"]],
        "token_export" => ["handler" => "Export:generateToken", "methods" => ["POST"], "security" => ["user_connected_security"]],
    ];

}