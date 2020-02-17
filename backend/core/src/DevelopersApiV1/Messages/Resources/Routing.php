<?php

namespace DevelopersApiV1\Messages\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "api/v1/messages/";

    protected $routes = [
#Message routing
        "remove" => ["handler" => "Message:removeMessage", "methods" => ["POST"]],
        "save" => ["handler" => "Message:saveMessage", "methods" => ["POST"]],
    ];

}