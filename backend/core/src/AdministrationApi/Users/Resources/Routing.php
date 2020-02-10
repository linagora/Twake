<?php

namespace AdministrationApi\Users\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/backend/users/";

    protected $routes = [
        "getUsers" => ["handler" => "Users:getAllUsers", "methods" => ["POST"]],
        "getOne" => ["handler" => "Users:getOneUser", "methods" => ["POST"]],
        "findUser" => ["handler" => "Users:findUser", "methods" => ["POST"]],
    ];

}