<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class ConnectionsUsingCASController extends Controller
{

    // Redirect user to CAS connection page
    public function loginAction()
    {
        $cas_login_page_url = $this->getParameter("cas_base_url");
        $cas_login_page_url .= "/login?";
        $cas_login_page_url .= "service=";
        $cas_login_page_url .= urlencode($this->getParameter("SERVER_NAME") . "ajax/users/cas/verify");
        return $this->redirect($cas_login_page_url);
    }

    // Verify CAS token and search for user in database (or create it)
    public function verifyAction(Request $request)
    {
        $ticket = $request->query->get("ticket");
        $cas_ticket_verification_url = $this->getParameter("cas_base_url");

        $cas_ticket_verification_url .= "/serviceValidate?";
        $cas_ticket_verification_url .= "service=";
        $cas_ticket_verification_url .= urlencode($this->getParameter("SERVER_NAME") . "ajax/users/cas/verify");
        $cas_ticket_verification_url .= "&ticket=" . $ticket;
        $cas_ticket_verification_url .= "&format=JSON";

        //var_dump($cas_ticket_verification_url);
        //die();

        $response = $this->get("circle.restclient")->get($cas_ticket_verification_url);
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
            $mail = $username . "@" . str_replace(Array("http", "https", ":", "/"), "", $this->getParameter("cas_base_url"));
            $firstname = "";
            $lastname = "";

            if (isset($details["attributes"])) {

                $mailKey = $this->getParameter("cas_email_key") ? $this->getParameter("cas_email_key") : "email";
                if (isset($details["attributes"][$mailKey])) {
                    $mail = $details["attributes"][$mailKey];
                }

                $lastnameKey = $this->getParameter("cas_lastname_key") ? $this->getParameter("cas_lastname_key") : "lastname";
                if (isset($details["attributes"][$lastnameKey])) {
                    $lastname = $details["attributes"][$lastnameKey];
                }

                $firstnameKey = $this->getParameter("cas_firstname_key") ? $this->getParameter("cas_firstname_key") : "firstname";
                if (isset($details["attributes"][$firstnameKey])) {
                    $firstname = $details["attributes"][$firstnameKey];
                }

            }

            //Search user with this username
            $res = $this->get("app.user")->loginWithUsername($username);
            if (!$res) {
                //Create user with this username
                $this->get("app.user")->subscribeInfo($mail, md5(bin2hex(random_bytes(32))), $username, $firstname, $lastname, "", null, "", "", null, $this->getParameter("cas_default_language"), "CAS", true);
                $res = $this->get("app.user")->loginWithUsername($username);
            }

            if ($res) {
                return $this->redirect($this->getParameter("SERVER_NAME"));
            }

        }
        return new Response("An error occured, please contact CAS service administrator.");

    }

    // Redirect user to CAS logout page
    public function logoutAction()
    {

        $this->get("app.user")->logout();

        $cas_login_page_url = $this->getParameter("cas_base_url") . "/logout";
        return $this->redirect($cas_login_page_url);
    }

}
