<?php

namespace AdministrationApi\Workspaces\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "administration.groups" => "AdministrationGroups",
//    arguments: [ "@app.twake_doctrine" ]
        "administration.workspaces" => "AdministrationWorkspaces",
//    arguments: [ "@app.twake_doctrine" ]
    ];

}