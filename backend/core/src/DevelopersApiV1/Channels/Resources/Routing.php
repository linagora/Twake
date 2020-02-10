<?php

namespace DevelopersApiV1\Channels\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/users/";

    protected $routes = [
#Message routing
        "get_direct_channel" => ["handler" => "Channel:getDirectChannel", "methods" => ["POST"]],


        "get_by_workspace" => ["handler" => "Channel:getChannelsByWorkspace", "methods" => ["POST"]],

    ];

}