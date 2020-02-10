<?php

namespace Twake\Channels\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/users/";

    protected $routes = [
#Direct messages
        "direct_messages/get" => ["handler" => "DirectMessages:getAction", "methods" => ["POST"]],
        "direct_messages/save" => ["handler" => "DirectMessages:save", "methods" => ["POST"]],
        "direct_messages/remove" => ["handler" => "DirectMessages:remove", "methods" => ["POST"]],

#Channels
        "get" => ["handler" => "Channels:getAction", "methods" => ["POST"]],
        "save" => ["handler" => "Channels:save", "methods" => ["POST"]],
        "remove" => ["handler" => "Channels:remove", "methods" => ["POST"]],

#Notifications
        "mute" => ["handler" => "ChannelsNotifications:mute", "methods" => ["POST"]],
        "unread" => ["handler" => "ChannelsNotifications:unread", "methods" => ["POST"]],
        "read" => ["handler" => "ChannelsNotifications:read", "methods" => ["POST"]],
    ];

}