<?php

namespace Twake\Core\Controller;

use Common\Http\Request;
use Common\Http\Response;

use Common\BaseController;
use WebSocket\Client;

class Version extends BaseController
{

    function getVersion(Request $request)
    {

        $auth = [];
        if ($this->getParameter("defaults.auth.internal.use")) {
            $auth[] = "internal";
        }
        if ($this->getParameter("defaults.auth.cas.use")) {
            $auth[] = "cas";
        }
        if ($this->getParameter("defaults.auth.openid.use")) {
            $auth[] = "openid";
        }

        $data = Array(
            "auth_mode" => $auth,
            "elastic_search_available" => !!$this->container->getParameter("es.host"),
            "help_link" => "https://go.crisp.chat/chat/embed/?website_id=9ef1628b-1730-4044-b779-72ca48893161",
            "websocket_public_key" => $this->container->getParameter("websocket.pusher_public"),
            "version" => "1.2.2-0",
            "last_compatible_mobile_version" => "1.2.000"
        );

        if ($this->container->hasParameter("defaults.branding")) {
            $branding = $this->container->getParameter("defaults.branding");
            if ($branding && $branding["name"]) {
                $data["branding"] = $branding;
            }
        }

        return new Response(Array("data" =>
            $data
        ));


    }

}
