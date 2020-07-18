<?php

namespace Twake\GlobalSearch\Resources;

use Common\BaseRouting;

class Routing extends BaseRouting
{

    protected $routing_prefix = "ajax/globalsearch/";

    protected $routes = [
        "quicksearch" => ["handler" => "GlobalSearch:QuickSearch", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "advancedbloc" => ["handler" => "GlobalSearch:AdvancedBloc", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "advancedfile" => ["handler" => "GlobalSearch:AdvancedFile", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "advancedtask" => ["handler" => "GlobalSearch:AdvancedTask", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "advancedevent" => ["handler" => "GlobalSearch:AdvancedEvent", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "tags/get" => ["handler" => "Tag:getAction", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "tags/save" => ["handler" => "Tag:save", "methods" => ["POST"], "security" => ["user_connected_security"]],
        "tags/remove" => ["handler" => "Tag:remove", "methods" => ["POST"], "security" => ["user_connected_security"]],
    ];

}