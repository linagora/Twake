<?php

namespace Twake\Core\Controller;

use Common\Http\Request;
use Common\Http\Response;

use Common\BaseController;

class Version extends BaseController
{

    function getVersion(Request $request)
    {

        $data = Array(
            "use_cas" => false,
            "elastic_search_available" => !!$this->container->getParameter("ELASTIC_SERVER"),
            "help_link" => "https://go.crisp.chat/chat/embed/?website_id=9ef1628b-1730-4044-b779-72ca48893161",
            "version" => "1.2.0-0",
            "last_compatible_mobile_version" => "1.2.000"
        );

        if ($this->container->hasParameter("branding")) {
            $branding = $this->container->getParameter("branding");
            if ($branding && $branding["name"]) {
                $data["branding"] = $branding;
            }
        }

        //TODO remove
        $this->get("app.websockets");

        return new Response(Array("data" =>
            $data
        ));


    }

}