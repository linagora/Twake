<?php


namespace Twake\Users\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class UsersRecover extends BaseController
{


    public function mail(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $email = $request->request->get("email", "");

        $res = $this->get("app.user")->requestNewPassword($email);
        if ($res) {

            $data["data"]["token"] = $res;

        } else {

            $data["errors"][] = "nosuchmail";

        }

        return new Response($data);

    }


    public function codeVerification(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $code = $request->request->get("code", "");
        $token = $request->request->get("token", "");

        $res = $this->get("app.user")->checkNumberForNewPasswordRequest($token, $code);

        if ($res) {

            $data["data"]["status"] = "success";

        } else {

            $data["errors"][] = "badcodeortoken";

        }

        return new Response($data);

    }


    public function newPassword(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $code = $request->request->get("code", "");
        $token = $request->request->get("token", "");
        $password = $request->request->get("password", "");

        $res = $this->get("app.user")->setNewPasswordAfterNewPasswordRequest($token, $code, $password);

        if ($res) {

            $data["data"]["status"] = "success";

        } else {

            $data["errors"][] = "badcodeortoken";

        }

        return new Response($data);

    }

}