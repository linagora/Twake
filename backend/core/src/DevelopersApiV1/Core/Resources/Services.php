<?php

namespace DevelopersApiV1\Core\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "api.v1.check" => "CheckService",
//        arguments: ["@app.twake_doctrine", "@api.v1.access_log"]
        "api.v1.api_status" => "ApiStatus",
//        arguments: ["@app.twake_doctrine"]
        "api.v1.access_log" => "AccessLogSystem",
//        arguments: ["@app.twake_doctrine"]
        "api.v1.check_user_data" => "CheckUserInfo",
//    arguments: ["@app.twake_doctrine"]
    ];

}