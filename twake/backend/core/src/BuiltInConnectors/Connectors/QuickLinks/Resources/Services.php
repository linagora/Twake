<?php

namespace BuiltInConnectors\Connectors\QuickLinks\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
      "connectors.quicklinks.event" => "Event",
      "connectors.quicklinks.links_service" => "LinksService",
    ];

}
