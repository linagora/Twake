<?php

namespace Configuration;

use Common\BaseBundles;

class Bundles extends BaseBundles
{
    protected $bundles = [
        "Twake/Core",
        "Twake/Users",
        "Twake/Calendar",
        "Twake/Channels",
        "Twake/Discussion",
        "Twake/Drive",
        "Twake/GlobalSearch",
        "Twake/Market",
        "Twake/Notifications",
        "Twake/Tasks",
        "Twake/Upload",
        "Twake/Workspaces",

        "DevelopersApiV1/Calendar",
        "DevelopersApiV1/Channels",
        "DevelopersApiV1/Core",
        "DevelopersApiV1/Drive",
        "DevelopersApiV1/General",
        "DevelopersApiV1/Messages",
        "DevelopersApiV1/Tasks",
        "DevelopersApiV1/Users",

        "AdministrationApi/Apps",
        "AdministrationApi/Core",
        "AdministrationApi/Counter",
        "AdministrationApi/Group",
        "AdministrationApi/Users",
        "AdministrationApi/Workspaces",

        "BuiltInConnectors/Common",

    ];

}
