<?php

namespace Twake\Users\Resources;

use Common\BaseServices;

class Services extends BaseServices
{

    protected $services = [
        "app.users" => "Users",
        "app.user" => "User",
        "app.user_updates" => "Updates",
        "app.user_provider" => "UserProvider"
    ];

}