<?php


namespace Twake\Users\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;
use Twake\Market\Entity\LinkAppWorkspace;

class UsersConnections extends BaseController
{

    public function alive(Request $request)
    {
        $time = microtime(true);
        $focus = $request->request->get("focus", true);
        if ($this->getUser() && !is_string($this->getUser()) && $focus) {
            $this->get("app.user")->alive($this->getUser()->getId());
        }
        return new Response(Array("data" => "ok"));

    }

    public function autoLogin(Request $request)
    {
        $this->login($request);
        return $this->redirect($this->getParameter("env.server_name"));
    }

    public function login(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $usernameOrMail = $request->request->get("_username", "");
        $password = $request->request->get("_password", "");
        $rememberMe = $request->request->get("_remember_me", true);

        $response = new Response();
        $loginResult = $this->get("app.user")->login($usernameOrMail, $password, $rememberMe, $request, $response);

        if ($loginResult) {

            $device = $request->request->get("device", false);
            if ($device && isset($device["type"]) && isset($device["value"])) {
                $this->get("app.user")->addDevice($this->getUser()->getId(), $device["type"], $device["value"], isset($device["version"]) ? $device["version"] : null);
                $this->get("administration.counter")->incrementCounter("total_devices_linked", 1);
            }

            $all_cookies = [];
            foreach ($response->getCookies() as $cookie) {
                $all_cookies[] = $cookie->asArray();
            }
            $data["access_token"] = [
                "time" => date("U")+0,
                "expiration" => date("U")+60*60*24*365,
                "refresh_exiration" => date("U")+60*60*24*365,
                "value" => json_encode($all_cookies),
                "type" => "Bearer"
            ];

            $data["data"]["status"] = "connected";

        } else {

            $data["data"]["status"] = "disconnected";

        }

        $response->setContent(json_encode($data));

        return $response;

    }

    public function mobileRedirect(Request $request)
    {
        $response = new Response();
        $response->setContent("<script>document.location='" . base64_decode($request->query->get("redirect")) . "'</script>");
        return $response;
    }

    public function isLogged(Request $request)
    {
        $ok = $this->getUser() && !is_string($this->getUser());

        if (!$ok) {
            $origin = $request->query->get("origin", "");
            $name = $request->query->get("name", "");
            $forename = $request->query->get("forename", "");
            $mail = $request->query->get("mail", "");
            $username = $request->query->get("username", "");
            $url = "https://app.twakeapp.com/?subscribe=1&origin=" . $origin;
            if ($username && $username != "") {
                $url = $url . "&username=" . $username;
            }
            if ($mail && $mail != "") {
                $url = $url . "&mail=" . $mail;
            }
            if ($name && $name != "") {
                $url = $url . "&name=" . $name;
            }
            if ($forename && $forename != "") {
                $url = $url . "&forename=" . $forename;
            }
            return $this->redirect($url);
        }
        return $this->redirect($this->getParameter("env.server_name"));
    }

    public function logout(Request $request)
    {

        $device = $request->request->get("device", false);
        if ($device && isset($device["type"])) {
            $this->get("app.user")->removeDevice($this->getUser()->getId(), $device["type"], $device["value"]);
            $this->get("administration.counter")->incrementCounter("total_devices_linked", -1);
        }
        $this->get("app.user")->logout($request);
        return new Response(Array());

    }


    public function currentUser(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $ok = $this->getUser() && !is_string($this->getUser());
        if (!$this->getUser()) {
            $data["errors"][] = "disconnected";
        } else {

            if( $this->get("app.session_handler")->getDidUseRememberMe() && $this->getUser()->getIdentityProvider()){
              $data["errors"][] = "redirect_to_" . $this->getUser()->getIdentityProvider();
              return new Response($data);
            }

            $device = $request->request->get("device", false);

            if ($device && isset($device["type"]) && isset($device["value"]) && $device["value"]) {
                $this->get("app.user")->addDevice($this->getUser()->getId(), $device["type"], $device["value"], $device["version"]);
                $this->get("administration.counter")->incrementCounter("total_devices_linked", 1);
            }

            $this->get("app.user")->updateTimezone($this->getUser(), $request->request->get("timezone", false));

            $data["data"] = $this->getUser()->getAsArray();
            $data["data"]["workspaces_preferences"] = $this->getUser()->getWorkspacesPreference();
            $data["data"]["notifications_preferences"] = $this->getUser()->getNotificationPreference();
            $data["data"]["tutorial_status"] = $this->getUser()->getTutorialStatus();

            $data["data"]["status"] = "connected";

            $workspaces_obj = $this->get("app.workspace_members")->getWorkspaces($this->getUser()->getId() . "");

            $workspaces = Array();
            $workspaces_ids = Array();
            $groups_ids = Array();
            foreach ($workspaces_obj as $workspace_obj) {
                $value = $workspace_obj["workspace"]->getAsArray();
                $value["_user_last_access"] = $workspace_obj["last_access"]->getTimestamp();
                $value["_user_hasnotifications"] = $workspace_obj["hasnotifications"];

                $workspaces[] = $value;

                $workspaces_ids[] = $value["id"];
                $groups_ids[] = $value["group"]["id"];
            }

            $workspaces_ids = array_values(array_unique($workspaces_ids));
            $groups_ids = array_values(array_unique($groups_ids));
            
            $this->get("app.workspace_members")->updateUser($this->getUser(), $workspaces_ids, $groups_ids);

            $mails = $this->get("app.user")->getSecondaryMails($this->getUser()->getId());

            $data["data"]["mails"] = Array();
            foreach ($mails as $mail) {
                $data["data"]["mails"][] = Array(
                    "id" => $mail->getId(),
                    "main" => ($this->getUser()->getEmail() == $mail->getMail()),
                    "email" => $mail->getMail()
                );
            }

            $data["data"]["workspaces"] = $workspaces;

        }


        return new Response($data);

    }

    public function setIsNew(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $value = $request->request->get("value");

        $ok = $this->getUser() && !is_string($this->getUser());
        if (!$ok) {
            $data["errors"][] = "disconnected";
        } else {

            $user = $this->getUser()->getId();
            $this->get("app.user")->setIsNew($value, $user);

        }

        return new Response($data);

    }

}
