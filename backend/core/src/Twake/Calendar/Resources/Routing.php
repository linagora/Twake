<?php

namespace Twake\Calendar\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/users/";

    protected $routes = [
#Events
        "event/get" => ["handler" => "Event:getAction", "methods" => ["POST"]],


        "event/save" => ["handler" => "Event:save", "methods" => ["POST"]],


        "event/remove" => ["handler" => "Event:remove", "methods" => ["POST"]],


#Calendars
        "calendar/get" => ["handler" => "Calendar:getAction", "methods" => ["POST"]],


        "calendar/save" => ["handler" => "Calendar:save", "methods" => ["POST"]],


        "calendar/remove" => ["handler" => "Calendar:remove", "methods" => ["POST"]],


#Export
        "export" => ["handler" => "Export:export", "methods" => ["POST", "GET"]],


        "token_export" => ["handler" => "Export:generateToken", "methods" => ["POST"]],


    ];

}