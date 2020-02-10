<?php

namespace DevelopersApiV1\Messages\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/users/";

    protected $routes = [
#Message routing
        "remove" => ["handler" => "Message:removeMessage", "methods" => ["POST"]],


        "save" => ["handler" => "Message:saveMessage", "methods" => ["POST"]],

    ];

}