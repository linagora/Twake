<?php

namespace Twake\Discussion\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "app.messages" => "MessageSystem"
//        arguments: ["@app.twake_doctrine", "@app.applications_api", "@app.websockets", "@app.channels.notifications", "@app.accessmanager"]
    ];

}