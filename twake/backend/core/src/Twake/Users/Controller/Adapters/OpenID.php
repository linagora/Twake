<?php

namespace Twake\Users\Controller\Adapters;

use Common\BaseController;
use Common\Http\Request;
use Common\Http\Response;
use Twake\Users\Controller\Adapters\OpenID\OpenIDConnectClient;
use Twake\Users\Entity\User;

class OpenID extends BaseController
{

    function logoutSuccess(Request $request)
    {
        try{
          $message = json_decode(urldecode($request->query->get("error_code")));
        }catch(\Exception $err){
          $message = "success";
        }
        return $this->closeIframe($message);
    }

    function logout(Request $request, $message = null)
    {
        error_reporting(E_ERROR | E_PARSE);

        $this->get("app.user")->logout($request);

        $logout_parameter = $this->getParameter("defaults.auth.openid.logout_query_parameter_key") ?: "post_logout_redirect_uri";
        $logout_url_suffix = $this->getParameter("defaults.auth.openid.logout_suffix") ?: "/logout";

        $logout_redirect_url = rtrim($this->getParameter("env.server_name"), "/") . "/ajax/users/openid/logout_success";

        if($message){
          $logout_redirect_url .= "?error_code=".str_replace('+', '%20', urlencode(json_encode($message)));
        }

        $redirect = "";
        if(!$this->getParameter("defaults.auth.openid.disable_logout_redirect")){
          $redirect =  "?" . $logout_parameter . "=" . urlencode($logout_redirect_url);
        }

        $this->redirect($this->getParameter("defaults.auth.openid.provider_uri") . $logout_url_suffix . $redirect);
    }

    function index(Request $request)
    {

        if (!$this->getParameter("defaults.auth.openid.use")) {
            return new Response(["error" => "OpenID is not enabled on this instance"]);
        }

        error_reporting(E_ERROR | E_PARSE);

        $this->get("app.user")->logout($request);

        try {
            $oidc = new OpenIDConnectClient(
                $this->getParameter("defaults.auth.openid.provider_uri"),
                $this->getParameter("defaults.auth.openid.client_id"),
                $this->getParameter("defaults.auth.openid.client_secret")
            );
            $oidc->setServerKey($this->app->getContainer()->getParameter("jwt.secret"));

            $oidc->providerConfigParam($this->getParameter("defaults.auth.openid.provider_config", []));

            $oidc->setRedirectURL(rtrim($this->getParameter("env.server_name"), "/") . "/ajax/users/openid");

            $oidc->addScope(array('openid', 'email', 'profile'));

            try {
                $authentificated = $oidc->authenticate([
                  "ignore_id_token" => true
                ]);
            }catch(\Exception $err){
                error_log("Error with Authenticated: ".$err);
                $authentificated = false;
            }
            if ($authentificated) {

                $data = [];
                $data["user_id"] = $oidc->requestUserInfo('sub'); //User unique id
                $data["nickname"] = $oidc->requestUserInfo('nickname'); //Prefered first name / username
                $data["given_name"] = $oidc->requestUserInfo('given_name'); //First name
                $data["family_name"] = $oidc->requestUserInfo('family_name'); //Second name
                $data["name"] = $oidc->requestUserInfo('name'); //Full name
                $data["email"] = $oidc->requestUserInfo('email');
                $data["email_verified"] = $oidc->requestUserInfo('email_verified');
                $data["picture"] = $oidc->requestUserInfo('picture'); //Thumbnail

                if ((empty($data["email_verified"]) || !$data["email_verified"] || empty($data["email"])) && !$this->getParameter("defaults.auth.openid.ignore_mail_verified")) {
                    return $this->logout($request, ["error" => "Your mail is not verified"]);
                }

                if (empty($data["user_id"])) {
                    return $this->logout($request, ["error" => "An error occurred (no unique id found)"]);
                }

                //Generate username, fullname, email, picture from recovered data
                $external_id = $data["user_id"];
                $email = $data["email"];
                $picture = $data["picture"];
                $fullname = $data["name"] ?: (($data["given_name"] . " " . $data["family_name"]) ?: $data["nickname"]);
                $fullname = explode("@", $fullname)[0];
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
                $userTokens = $this->get("app.user")->loginFromServiceWithToken("openid", $external_id, $email, $username, $fullname, $picture);

                if ($userTokens) {
                    return $this->closeIframe("success", $userTokens);
                }else{
                    return $this->logout($request, ["error" => "No user profile created"]);
                }

            }else{
                return $this->logout($request, ["error" => "OIDC auth error"]);
            }

        } catch (\Exception $e) {
            error_log($e);
            $this->logout($request);
        }

        return $this->logout($request, ["error" => "An unknown error occurred"]);

    }

    private function closeIframe($message, $userTokens=null)
    {
        $this->redirect(rtrim($this->getParameter("env.frontend_server_name", $this->getParameter("env.server_name")), "/") . "?external_login=".str_replace('+', '%20', urlencode(json_encode(["provider"=>"openid", "message" => $message, "token" => json_encode($userTokens)]))));
    }

}
