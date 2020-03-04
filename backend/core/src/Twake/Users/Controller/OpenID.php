<?php

namespace Twake\Users\Controller;

use Common\BaseController;
use Common\Http\Request;
use Common\Http\Response;
use Jumbojett\OpenIDConnectClient;

class OpenID extends BaseController
{

    function index(Request $request)
    {

        if (!$this->getParameter("auth.openid.use")) {
            return new Response(["error" => "OpenID is not enabled on this instance"]);
        }

        $oidc = new OpenIDConnectClient(
            $this->getParameter("auth.openid.provider_uri"),
            $this->getParameter("auth.openid.client_id"),
            $this->getParameter("auth.openid.client_secret")
        );


        $oidc->authenticate();

        $data = [];
        $data["user_id"] = $oidc->requestUserInfo('user_id');
        $data["given_name"] = $oidc->requestUserInfo('given_name');
        $data["email"] = $oidc->requestUserInfo('email');
        $data["picture"] = $oidc->requestUserInfo('picture');

        return new Response(["data" => $data]);

    }

}