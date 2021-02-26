<?php

namespace Twake\Market\Resources;

use Common\BaseServices;

class Services extends BaseServices
{

    protected $services = [
        "app.applications" => "MarketApplication",
        "app.applications_api" => "ApplicationApi",
        "website_api_market.data_token" => "DataTokenSystem",
    ];

}