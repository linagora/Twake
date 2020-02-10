<?php

namespace Twake\Tasks\Resources;

use Common\BaseServices;

class Services extends BaseServices
{

    protected $services = [
        "app.tasks.task" => "BoardTask",
//        arguments: ["@app.twake_doctrine", "@app.websockets", "@app.applications_api", "@app.notifications", "@app.tasks.export"]
        "app.tasks.list" => "BoardList",
//        arguments: ["@app.twake_doctrine", "@app.websockets", "@app.applications_api", "@app.notifications", "@app.tasks.export"]
        "app.tasks.board" => "BoardBoard",
//        arguments: ["@app.twake_doctrine", "@app.applications_api", "@app.tasks.list", "@app.tasks.task"]
        "app.tasks.export" => "BoardExport",
//        arguments: ["@app.twake_doctrine"]
    ];

}