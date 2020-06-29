<?php

namespace AdministrationApi\Group\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "administration.group" => "AdministrationGroup",
//    arguments: [ "@app.twake_doctrine" ]
    ];

}