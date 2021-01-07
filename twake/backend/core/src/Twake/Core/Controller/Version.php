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
              "account_management_url" => $this->getParameter("defaults.auth.console.redirections.account_management_url"),
              "company_management_url" => $this->getParameter("defaults.auth.console.redirections.company_management_url"),
              "collaborators_management_url" => $this->getParameter("defaults.auth.console.redirections.collaborators_management_url"),
            ];
        }

        $data = Array(
            "ready" => $ready,
            "auth_mode" => array_keys($auth),
            "auth" => $auth,
            "elastic_search_available" => !!$this->container->getParameter("es.host"),
            "help_link" => "https://community.twake.app"
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
