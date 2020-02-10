<?php

namespace Twake\GlobalSearch\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/users/";

    protected $routes = [
        "quicksearch" => ["handler" => "GlobalSearch:QuickSearch", "methods" => ["POST"]],

        "advancedbloc" => ["handler" => "GlobalSearch:AdvancedBloc", "methods" => ["POST"]],

        "advancedfile" => ["handler" => "GlobalSearch:AdvancedFile", "methods" => ["POST"]],

        "advancedtask" => ["handler" => "GlobalSearch:AdvancedTask", "methods" => ["POST"]],

        "advancedevent" => ["handler" => "GlobalSearch:AdvancedEvent", "methods" => ["POST"]],

        "tags/get" => ["handler" => "Tag:getAction", "methods" => ["POST"]],

        "tags/save" => ["handler" => "Tag:save", "methods" => ["POST"]],

        "tags/remove" => ["handler" => "Tag:remove", "methods" => ["POST"]],
    ];

}