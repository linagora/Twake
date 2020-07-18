<?php

namespace DevelopersApiV1\Channels\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/v1/channels/";

    protected $routes = [
#Message routing
        "get_direct_channel" => ["handler" => "Channel:getDirectChannel", "methods" => ["POST"]],
        "get_by_workspace" => ["handler" => "Channel:getChannelsByWorkspace", "methods" => ["POST"]],
    ];

}