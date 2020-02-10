<?php

namespace Twake\Tasks\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/users/";

    protected $routes = [
#Tasks
        "task/get" => ["handler" => "Task:getAction", "methods" => ["POST"]],


        "task/save" => ["handler" => "Task:save", "methods" => ["POST"]],


        "task/remove" => ["handler" => "Task:remove", "methods" => ["POST"]],


#Lists
        "list/get" => ["handler" => "BoardList:getAction", "methods" => ["POST"]],


        "list/save" => ["handler" => "BoardList:save", "methods" => ["POST"]],


        "list/remove" => ["handler" => "BoardList:remove", "methods" => ["POST"]],


        "list/tasks/remove" => ["handler" => "BoardList:removeAll", "methods" => ["POST"]],


        "list/tasks/archive" => ["handler" => "BoardList:archiveAll", "methods" => ["POST"]],


#Boards
        "board/get" => ["handler" => "Board:getAction", "methods" => ["POST"]],


        "board/save" => ["handler" => "Board:save", "methods" => ["POST"]],


        "board/remove" => ["handler" => "Board:remove", "methods" => ["POST"]],


#Export
        "export" => ["handler" => "Export:export", "methods" => ["POST", "GET"]],


        "token_export" => ["handler" => "Export:generateToken", "methods" => ["POST"]],


    ];

}