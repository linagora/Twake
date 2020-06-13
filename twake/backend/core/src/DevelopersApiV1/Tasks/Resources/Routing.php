<?php

namespace DevelopersApiV1\Tasks\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/v1/tasks/";

    protected $routes = [
#Tasks routing
        "task/remove" => ["handler" => "Tasks:removeTask", "methods" => ["POST"]],
        "task/save" => ["handler" => "Tasks:saveTask", "methods" => ["POST"]],
        "get_boards" => ["handler" => "Tasks:getBoardList", "methods" => ["POST"]],
        "task/get" => ["handler" => "Tasks:getTasksInBoard", "methods" => ["POST"]],
        "task/get_lists" => ["handler" => "Tasks:getListsInBoard", "methods" => ["POST"]],
    ];

}