<?php

namespace DevelopersApiV1\Calendar\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/v1/calendar/";

    protected $routes = [
#Calendar routing
        "event/remove" => ["handler" => "Calendar:removeEvent", "methods" => ["POST"]],
        "event/save" => ["handler" => "Calendar:saveEvent", "methods" => ["POST"]],
        "get_calendars" => ["handler" => "Calendar:getCalendarList", "methods" => ["POST"]],
    ];

}