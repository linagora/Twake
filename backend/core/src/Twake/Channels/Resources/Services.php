<?php

namespace Twake\Channels\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "app.channels.direct_messages_system" => "DirectMessagesSystem",
//            arguments: ["@app.twake_doctrine", "@app.messages", "@app.applications_api","@app.workspace_members"]
        "app.channels.channels_system" => "ChannelsSystem",
//            arguments: ["@app.twake_doctrine", "@app.messages", "@app.websockets", "@app.applications_api", "@app.workspace_members", "@app.accessmanager"]
        "app.channels.notifications" => "ChannelsNotificationsSystem",
//            arguments: [ "@app.twake_doctrine", "@app.notifications", "@app.pusher","@app.workspace_members"]
    ];

}