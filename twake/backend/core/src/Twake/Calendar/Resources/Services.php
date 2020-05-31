<?php

namespace Twake\Calendar\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "app.calendar.event" => "CalendarEvent",
//        arguments: ["@app.twake_doctrine", "@app.websockets", "@app.applications_api", "@app.notifications", "@app.calendar.export"]
        "app.calendar.calendar" => "CalendarCalendar",
//        arguments: ["@app.twake_doctrine", "@app.applications_api"]
        "app.calendar.export" => "CalendarExport",
//        arguments: ["@app.twake_doctrine"]
    ];

}