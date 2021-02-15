<?php

namespace Twake\Channels\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "app.channels.direct_messages_system" => "DirectMessagesSystem",
        "app.channels.channels_system" => "ChannelsSystem"
    ];

}