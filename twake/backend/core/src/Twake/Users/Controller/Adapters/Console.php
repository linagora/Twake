<?php

namespace Twake\Users\Controller\Adapters;

use Common\BaseController;
use Common\Http\Request;
use Common\Http\Response;
use Twake\Users\Entity\User;
use Twake\Users\Controller\Adapters\OpenID\OpenIDConnectClient;
use Twake\Users\Controller\Adapters\Console\Hooks;
use Twake\Users\Controller\Adapters\Console\ApplyUpdates;
class Console extends BaseController
{

    /*
    function hook(Request $request)
    {
        if(!$this->isServiceEnabled()){
            return new Response(["error" => "unauthorized"], 401);
        }

        $handler = new Hooks($this->app);
        $res = $handler->handle($request);
        error_log(json_encode($res->getContent()));
        return $res;
    }
    */

    //Redirect hook to the console
    function hook(Request $request)
    {
        if(!$this->isServiceEnabled()){
            return new Response(["error" => "unauthorized"], 401);
        }

        $api = $this->app->getServices()->get("app.restclient");

        $secret = $request->query->get("secret_key");
        $uri = str_replace("/private", "/internal/services/console/v1", $this->app->getContainer()->getParameter("node.api")) . 
            ltrim("/hook?secret_key=".$secret, "/");

        $opt = [
            CURLOPT_HTTPHEADER => Array(
                "Authorization: Bearer " . $jwt,
                "Content-Type: application/json"
            ),
            CURLOPT_CONNECTTIMEOUT => 1,
            CURLOPT_TIMEOUT => 1
        ];

        $data = [
            "content" => $request->request->get("content"),
            "type" => $request->request->get("type")
        ];

        $res = $api->request("POST", $uri, json_encode($data), $opt);

        error_log(json_encode($res));

        return new Response([], 200);

        $handler = new Hooks($this->app);
        $res = $handler->handle($request);
        error_log(json_encode($res->getContent()));
        return $res;
    }

    
    function logoutSuccess(Request $request)
    {
        if(!$this->isServiceEnabled()){
            return new Response(["error" => "unauthorized"], 401);
        }
        try{
          $message = json_decode(urldecode($request->query->get("error_code")));
        }catch(\Exception $err){
          $message = false;
        }

        return $this->redirect(rtrim($this->getParameter("env.frontend_server_name", $this->getParameter("env.server_name")), "/") . "/login" . ($message ? ("?error_code=".str_replace('+', '%20', urlencode(json_encode($message)))) : "?auto"));
    }

    function logout(Request $request, $message = null)
    {
        error_log(json_encode($message));

        if(!$this->isServiceEnabled()){
            return new Response(["error" => "unauthorized"], 401);
        }
        error_reporting(E_ERROR | E_PARSE);

        $this->get("app.user")->logout($request);

        $logout_parameter = $this->getParameter("defaults.auth.console.openid.logout_query_parameter_key") ?: "post_logout_redirect_uri";
        $logout_url_suffix = $this->getParameter("defaults.auth.console.openid.logout_suffix") ?: "/oauth2/logout";

        $logout_redirect_url = rtrim($this->getParameter("env.server_name"), "/") . "/ajax/users/console/openid/logout_success";

        if($message){
          $logout_redirect_url .= "?error_code=".str_replace('+', '%20', urlencode(json_encode($message)));
        }

        $redirect = "";
        if(!$this->getParameter("defaults.auth.console.openid.disable_logout_redirect")){
          $redirect =  "?" . $logout_parameter . "=" . urlencode($logout_redirect_url);
        }

        $this->redirect($this->getParameter("defaults.auth.console.openid.provider_uri") . $logout_url_suffix . $redirect);
    }

    function index(Request $request)
    {
        if(!$this->isServiceEnabled()){
            return new Response(["error" => "unauthorized"], 401);
        }

        error_reporting(E_ERROR | E_PARSE);

        $this->get("app.user")->logout($request);

        //We store the mobile session
        if (!isset($_SESSION)) {
            @session_start();
        }

        if($request->query->get("mobile", "")){
            $_SESSION["mobile"] = true;
        }

        if($request->query->get("localhost", "")){
            $_SESSION["localhost"] = true;
            $_SESSION["localhost_port"] = $request->query->get("port", "3000");
        }

        try {
            $oidc = new OpenIDConnectClient(
                $this->getParameter("defaults.auth.console.openid.provider_uri"),
                $this->getParameter("defaults.auth.console.openid.client_id"),
                $this->getParameter("defaults.auth.console.openid.client_secret")
            );
            $oidc->setServerKey($this->app->getContainer()->getParameter("jwt.secret"));

            $oidc->setCodeChallengeMethod($this->getParameter("defaults.auth.console.openid.provider_config.code_challenge_methods_supported", [""])[0]);
            $oidc->providerConfigParam($this->getParameter("defaults.auth.console.openid.provider_config", []));

            $oidc->setRedirectURL(rtrim($this->getParameter("env.server_name"), "/") . "/ajax/users/console/openid");

            $oidc->addScope(array('openid', 'email', 'profile', 'address', 'phone', 'offline_access'));
            try {
                $authentificated = $oidc->authenticate([
                  "ignore_id_token" => true,
                  "ignore_nonce" => true
                ]);
            }catch(\Exception $err){
                error_log("Error with Authenticated: ".$err);
                $authentificated = false;
            }
            if ($authentificated) {
                return $this->generateReplyForLoginFromOIDCAccessToken($oidc->getAccessToken());
            }else{
                return $this->logout($request, ["error" => "OIDC auth error"]);
            }

        } catch (\Exception $e) {
            error_log($e);
            $this->logout($request, ["error" => "Unknown error while processing OIDC login"]);
        }

        return $this->logout($request, ["error" => "An unknown error occurred"]);

    }

    function loginFromOIDCAccessToken(Request $request){
        return new Response($this->generateReplyForLoginFromOIDCAccessToken($request->request->get("access_token"), false), 200);
    }


    function generateReplyForLoginFromOIDCAccessToken($access_token = null, $redirect = true){

        $accessToken = $access_token;

        $url = rtrim($this->getParameter("defaults.auth.console.provider"), "/") . "/users/profile";
        $header = "Authorization: Bearer " . $accessToken;
        $response = $this->app->getServices()->get("app.restclient")->get($url, array(CURLOPT_HTTPHEADER => [$header]));
        $response = json_decode($response->getContent(), 1);

        error_log($header);
        error_log(json_encode($response));

        try {

            /** @var User $user */
            $user = (new ApplyUpdates($this->app))->updateUser($response);

            $userTokens = null;
            if($user){
                $userTokens = $this->get("app.user")->loginWithIdOnlyWithToken($user->getId());
            }

        } catch (\Exception $e) {
            error_log($e);

            if(!$redirect){
                return ["error" => "Unknown error while creating/getting your account"];
            }

            $this->logout($request, ["error" => "Unknown error while creating/getting account"]);
        }

        if ($userTokens) {

            if(!$redirect){
                return ["access_token" => $this->get("app.user")->generateJWT($user)];
            }

            return $this->redirect(rtrim($this->getParameter("env.server_name"), "/")
            . "/ajax/users/console/redirect_to_app?token=" . urlencode($userTokens["token"]) . "&username=" . urlencode($userTokens["username"]) );
        }else{

            if(!$redirect){
                return ["error" => "No user profile created."];
            }

            return $this->logout($request, ["error" => "No user profile created: is your email already used in Twake?"]);
        }
    }

    function redirectToApp(Request $request){
        if (!isset($_SESSION)) {
            @session_start();
        }
        if($_SESSION["mobile"]){
            return new Response("", 200);
        }else{
            return $this->closeIframe("success", [
                "token" => $request->query->get("token"),
                "username" => $request->query->get("username")
            ]);
        }
    }

    private function closeIframe($message, $userTokens=null)
    {
        $server = rtrim($this->getParameter("env.frontend_server_name", $this->getParameter("env.server_name")), "/");
        if($_SESSION["localhost"]){
            $server = "http://localhost:" . $_SESSION["localhost_port"];
            $_SESSION["localhost"] = false;
        }
        $this->redirect($server
            . "/?external_login=".str_replace('+', '%20', urlencode(json_encode(["provider"=>"console", "message" => $message, "token" => json_encode($userTokens)]))));
    }

    private function isServiceEnabled(){
        return $this->app->getContainer()->getParameter("defaults.auth.console.use");
    }

}
