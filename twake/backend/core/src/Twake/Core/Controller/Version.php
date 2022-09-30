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

        $ready = $this->get("app.update_services_status")->execute();

        $auth = [];
        if ($this->getParameter("defaults.auth.internal.use")) {
            $auth["internal"] = [
              "disable_account_creation" => $this->getParameter("defaults.auth.internal.disable_account_creation"),
              "disable_email_verification" => $this->getParameter("defaults.auth.internal.disable_email_verification"),
              "use" => true,
            ];
        }
        if ($this->getParameter("defaults.auth.cas.use")) {
            $auth["cas"] = [
              "use" => true,
            ];
        }
        if ($this->getParameter("defaults.auth.openid.use")) {
            $auth["openid"] = [
              "use" => true,
            ];
        }
        if ($this->getParameter("defaults.auth.console.use")) {
            $auth["console"] = [
              "use" => true,
              "max_unverified_days" => intval($this->getParameter("defaults.auth.console.configuration.max_unverified_days", "7")),
              "account_management_url" => $this->getParameter("defaults.auth.console.redirections.account_management_url"),
              "company_management_url" => $this->getParameter("defaults.auth.console.redirections.company_management_url"),
              "collaborators_management_url" => $this->getParameter("defaults.auth.console.redirections.collaborators_management_url"),
            ];
        }

        $data = Array(
            "ready" => $ready,
            "auth_mode" => array_keys($auth),
            "auth" => $auth,
            "version" => [
                "current" => /* @VERSION_DETAIL */ "2022.Q4.1120",
                "minimal" => [
                    "web" => /* @MIN_VERSION_WEB */ "2022.Q2.975",
                    "mobile" => /* @MIN_VERSION_MOBILE */ "2022.Q2.975",
                ]
            ],
            "elastic_search_available" => !!$this->container->getParameter("es.host"),
            "help_url" => "https://go.crisp.chat/chat/embed/?website_id=9ef1628b-1730-4044-b779-72ca48893161"
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
