<?php

namespace AdministrationApi\Counter\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "administration.counter" => "CounterService",
//    arguments: [ "@app.twake_doctrine" ]
    ];

}