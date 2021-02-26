<?php


namespace Twake\Users\Controller\Adapters;

use Common\BaseController;
use Common\Http\Request;
use Common\Http\Response;

class CAS extends BaseController
{

    function logoutSuccess(Request $request)
    {
        return $this->closeIframe("success");
    }

    // Redirect user to CAS connection page
    public function login()
    {
        $cas_login_page_url = $this->getParameter("defaults.auth.cas.base_url");
        $cas_login_page_url .= "/login?";
        $cas_login_page_url .= "service=";
        $cas_login_page_url .= urlencode($this->getParameter("env.server_name") . "ajax/users/cas/verify");
        return $this->redirect($cas_login_page_url);
    }

    // Verify CAS token and search for user in database (or create it)
    public function verify(Request $request)
    {
        $ticket = $request->query->get("ticket");
        $cas_ticket_verification_url = $this->getParameter("defaults.auth.cas.base_url");

        $cas_ticket_verification_url .= "/serviceValidate?";
        $cas_ticket_verification_url .= "service=";
        $cas_ticket_verification_url .= urlencode($this->getParameter("env.server_name") . "ajax/users/cas/verify");
        $cas_ticket_verification_url .= "&ticket=" . $ticket;
        $cas_ticket_verification_url .= "&format=JSON";

        //var_dump($cas_ticket_verification_url);
        //die();

        $response = $this->get("app.restclient")->get($cas_ticket_verification_url);
        $response = $response->getContent();
        if (strpos($response, "<cas:") !== false) {
            $result = Array();
            if (strpos($response, "cas:authenticationSuccess") !== false) {
                $username = explode("<cas:user>", $response);
                $username = explode("</cas:user>", $username[1]);
                $username = $username[0];
                if ($username) {
                    $result = Array(
                        "serviceResponse" => Array(
                            "authenticationSuccess" => Array(
                                "user" => $username
                            )
                        )
                    );
                }
            }
        } else {
            $result = json_decode($response, true);
        }

        if (isset($result["serviceResponse"]) && isset($result["serviceResponse"]["authenticationSuccess"])) {
            $details = $result["serviceResponse"]["authenticationSuccess"];

            $username = $details["user"];
            $mail = $username . "@" . str_replace(Array("http", "https", ":", "/"), "", $this->getParameter("defaults.auth.cas.base_url"));
            $firstname = "";
            $lastname = "";

            if (isset($details["attributes"])) {

                $mailKey = $this->getParameter("defaults.auth.cas.email_key") ? $this->getParameter("defaults.auth.cas.email_key") : "email";
                if (isset($details["attributes"][$mailKey])) {
                    $mail = $details["attributes"][$mailKey];
                }

                $lastnameKey = $this->getParameter("defaults.auth.cas.lastname_key") ? $this->getParameter("defaults.auth.cas.lastname_key") : "lastname";
                if (isset($details["attributes"][$lastnameKey])) {
                    $lastname = $details["attributes"][$lastnameKey];
                }

                $firstnameKey = $this->getParameter("defaults.auth.cas.firstname_key") ? $this->getParameter("defaults.auth.cas.firstname_key") : "firstname";
                if (isset($details["attributes"][$firstnameKey])) {
                    $firstname = $details["attributes"][$firstnameKey];
                }

            }

            //Search user with this username
            $res = $this->get("app.user")->loginFromServiceWithToken("cas", $mail, $mail, $username, $firstname . " " . $lastname, "");

            if ($res) {
                return $this->closeIframe("success", $res);
            }

        }
        return new Response("An error occured, please contact CAS service administrator.");

    }

    // Redirect user to CAS logout page
    public function logout(Request $request)
    {
        $this->get("app.user")->logout($request);

        $cas_login_page_url = $this->getParameter("defaults.auth.cas.base_url") . "/logout";
        return $this->redirect($cas_login_page_url);
    }

    private function closeIframe($message, $userTokens=null)
    {
        $this->redirect(rtrim($this->getParameter("env.frontend_server_name", $this->getParameter("env.server_name")), "/") . "?external_login=".str_replace('+', '%20', urlencode(json_encode(["provider"=>"openid", "message" => $message, "token" => json_encode($userTokens)]))));
    }

}
