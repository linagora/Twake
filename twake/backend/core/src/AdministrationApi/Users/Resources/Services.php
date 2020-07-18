<?php

namespace AdministrationApi\Users\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "administration.users" => "AdministrationUsers",
//    arguments: [ "@app.twake_doctrine" ]
    ];

}