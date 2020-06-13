<?php

namespace AdministrationApi\Apps\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "administration.apps" => "AdministrationApps",
//    arguments: [ "@app.twake_doctrine" ]
    ];

}