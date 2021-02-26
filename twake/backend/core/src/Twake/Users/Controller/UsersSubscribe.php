<?php


namespace Twake\Users\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class UsersSubscribe extends BaseController
{


    public function mail(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );


        $email = $request->request->get("email", "");
        $username = $request->request->get("username", "");
        $password = $request->request->get("password", "");
        $name = $request->request->get("name", "");
        $firstname = $request->request->get("firstname", "");
        $phone = $request->request->get("phone", "");
        $language = $request->request->get("language", "");
        $newsletter = $request->request->get("newsletter", "");

        $res = $this->get("app.user")->subscribeMail($email, $username, $password, $name, $firstname, $phone, $language, $newsletter);

        if ($res && (!is_array($res) || !isset($res["error"]))) {

            $data["data"]["token"] = $res;

        } else {

            $data["errors"][] = $res["error"];

        }

        return new Response($data);

    }

    public function doVerifyMail(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $code = $request->request->get("code", "");
        $token = $request->request->get("token", "");
        $mail = $request->request->get("mail", "");

        $mail = trim(strtolower($mail));

        $response = new Response(Array());

        $res = $this->get("app.user")->verifyMail($mail, $token, $code, false, $response);

        if ($res) {

            $data["data"]["status"] = "success";

            $device = $request->request->get("device", false);
            if ($device && isset($device["type"]) && isset($device["value"])) {
                $this->get("app.user")->addDevice($this->getUser()->getId(), $device["type"], $device["value"], isset($device["version"]) ? $device["version"] : null);
                $this->get("administration.counter")->incrementCounter("total_devices_linked", 1);
            }

            $this->get("administration.counter")->incrementCounter("total_users", 1);

            if($this->isConnected()){
                $data["access_token"] = $this->get("app.user")->generateJWT($this->getUser());
            }

        } else {

            $data["errors"][] = "error";

        }

        $response->setContent(json_encode($data));

        return $response;
    }

    public function getAvaible(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $mail = $request->request->get("mail", "");
        $username = $request->request->get("username", "");


        $res = $this->get("app.user")->getAvaibleMailPseudo($mail, $username);

        if (is_bool($res) && $res == true) {
            $data["data"]["status"] = "success";
        } elseif (is_array($res)) {
            if (in_array(-1, $res)) {

                $data["errors"][] = "mailalreadytaken";

            }
            if (in_array(-2, $res)) {

                $data["errors"][] = "usernamealreadytaken";

            }
        }

        return new Response($data);
    }

    public function createCompanyUser(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $mail = $request->request->get("mail", "");
        $fullname = $request->request->get("fullname", "");
        $password = $request->request->get("password", "");
        $language = $request->request->get("language", "");
        $workspace_id = $request->request->get("workspace_id", "");
        $current_user_id = $this->getUser()->getId();

        $can = $this->get('app.workspace_levels')->can($workspace_id, $this->getUser(), "external_accounts:write");
        $res = ["not_allowed"];
        if ($can) {
            $res = $this->get("app.user")->createCompanyUser($mail, $fullname, $password, $language, $workspace_id, $current_user_id);
        }

        if ($res === true) {
            $data["data"] = "success";
        } else {
            $data["errors"] = $res;
        }

        return new Response($data);
    }


}