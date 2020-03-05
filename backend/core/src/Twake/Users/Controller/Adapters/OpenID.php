<?php

namespace Twake\Users\Controller\Adapters;

use Common\BaseController;
use Common\Http\Request;
use Common\Http\Response;
use Jumbojett\OpenIDConnectClient;
use Twake\Users\Entity\User;

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

        $oidc->addScope(array('openid', 'email', 'profile'));
        if ($oidc->authenticate()) {

            $data = [];
            $data["user_id"] = $oidc->requestUserInfo('sub'); //User unique id
            $data["nickname"] = $oidc->requestUserInfo('nickname'); //Prefered first name / username
            $data["given_name"] = $oidc->requestUserInfo('given_name'); //First name
            $data["family_name"] = $oidc->requestUserInfo('family_name'); //Second name
            $data["name"] = $oidc->requestUserInfo('name'); //Full name
            $data["email"] = $oidc->requestUserInfo('email');
            $data["email_verified"] = $oidc->requestUserInfo('email_verified');
            $data["picture"] = $oidc->requestUserInfo('picture'); //Thumbnail

            if (empty($data["email_verified"]) || !$data["email_verified"] || empty($data["email"])) {
                return new Response(["error" => "Your mail is not verified"]);
            }

            if (empty($data["user_id"])) {
                return new Response(["error" => "An error occurred (no unique id found)"]);
            }

            //Generate username, fullname, email, picture from recovered data
            $external_id = $data["user_id"];
            $email = $data["email"];
            $picture = $data["picture"];
            $fullname = $data["name"] ?: (($data["given_name"] . " " . $data["family_name"]) ?: $data["nickname"]);
            $username = preg_replace("/ '/", "_",
                preg_replace("/[^a-zA-Z0-9]/", "",
                    trim(
                        strtolower(
                            $data["nickname"] ?: ($fullname ?: explode("@", $data["email"])[0])
                        )
                    )
                )
            );

            /** @var User $user */
            $user = $this->get("app.user")->loginFromService("openid", $external_id, $email, $username, $fullname, $picture);

            if ($user) {
                $this->redirect($this->getParameter("SERVER_NAME"));
                return null;
            }

        }

        return new Response(["error" => "An unknown error occurred"]);

    }

}