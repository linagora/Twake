<?php

namespace Twake\Calendar\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/calendar/";

    protected $routes = [
#Events
        "event/get" => ["handler" => "Event:getAction", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "event/save" => ["handler" => "Event:save", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "event/remove" => ["handler" => "Event:remove", "methods" => ["POST"], "security" => ["user_connected_security"]],
#Calendars
        "calendar/get" => ["handler" => "Calendar:getAction", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "calendar/save" => ["handler" => "Calendar:save", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "calendar/remove" => ["handler" => "Calendar:remove", "methods" => ["POST"], "security" => ["user_connected_security"]],
#Export
        "export" => ["handler" => "Export:export", "methods" => ["POST", "GET"]],
        "token_export" => ["handler" => "Export:generateToken", "methods" => ["POST"], "security" => ["user_connected_security"]],
    ];

}