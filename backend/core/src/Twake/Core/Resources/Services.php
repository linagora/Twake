<?php

namespace Twake\Core\Resources;

use Common\BaseServices;

class Services extends BaseServices
{

    protected $services = [
        "user_connected_security" => "UserConnectedSecurity",
        "app.websockets" => "Websockets",
        "app.twake_mailer" => "TwakeMailer",
        "app.restclient" => "TwakeRestClient",
        "app.pusher" => "Pusher",
        "app.translate" => "Translate",
        "app.twake_doctrine" => "DoctrineAdapter/ManagerAdapter",
        "app.websockets" => "Websockets",
        "app.accessmanager" => "AccessManager",
        "app.exportversion" => "ExportManager",
        "app.string_cleaner" => "StringCleaner",
        "app.session_handler" => "DoctrineAdapter/SessionHandler"
    ];

}