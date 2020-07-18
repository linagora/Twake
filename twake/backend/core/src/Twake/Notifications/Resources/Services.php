<?php

namespace Twake\Notifications\Resources;

use Common\BaseServices;

class Services extends BaseServices
{

    protected $services = [
        "app.notifications" => "Notifications",
//        arguments: ["@app.twake_doctrine","@app.websockets", "@app.twake_mailer", "@app.restclient", "%PUSH_NOTIFICATION_SERVER%", "%STANDALONE%", "%LICENCE_KEY%"]
//        public: true
    ];

}