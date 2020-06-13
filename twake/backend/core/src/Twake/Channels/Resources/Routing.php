<?php

namespace Twake\Channels\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/channels/";

    protected $routes = [
#Direct messages
        "direct_messages/get" => ["handler" => "DirectMessages:getAction", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "direct_messages/save" => ["handler" => "DirectMessages:save", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "direct_messages/remove" => ["handler" => "DirectMessages:remove", "methods" => ["POST"], "security" => ["user_connected_security"]],
#Channels
        "get" => ["handler" => "Channels:getAction", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "save" => ["handler" => "Channels:save", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "remove" => ["handler" => "Channels:remove", "methods" => ["POST"], "security" => ["user_connected_security"]],
#Notifications
        "mute" => ["handler" => "ChannelsNotifications:mute", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "unread" => ["handler" => "ChannelsNotifications:unread", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "read" => ["handler" => "ChannelsNotifications:read", "methods" => ["POST"], "security" => ["user_connected_security"]],
    ];

}