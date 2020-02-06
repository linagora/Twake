<?php

namespace Twake\Users\Resources;

use Common\BaseServices;

class Services extends BaseServices
{

    protected $services = [

        "app.core_remember_me_manager" => "RememberMe",
        "app.users" => "Users",
        "app.user" => "User",
        "app.user_updates" => "Updates"
    ];

}