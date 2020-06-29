<?php

namespace Twake\Market\Resources;

use Common\BaseServices;

class Services extends BaseServices
{

    protected $services = [
        "app.applications" => "MarketApplication",
//        arguments: ["@app.twake_doctrine", "@app.group_managers","@app.pricing_plan"]
        "app.applications_api" => "ApplicationApi",
//        arguments: ["@app.twake_doctrine", "@app.restclient"]
        "website_api_market.data_token" => "DataTokenSystem",
//        arguments: ["@app.twake_doctrine"]
    ];

}