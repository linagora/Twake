<?php

namespace Twake\Discussion\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "app.messages" => "MessageSystem",
        "app.messages.depreciated" => "MessageSystemDepreciated"
    ];

}