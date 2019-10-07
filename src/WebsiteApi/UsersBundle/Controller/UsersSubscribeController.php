<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UsersSubscribeController extends Controller
{


    public function mailAction(Request $request)
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

        return new JsonResponse($data);

    }

    public function doVerifyMailAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $code = $request->request->get("code", "");
        $token = $request->request->get("token", "");
        $mail = $request->request->get("mail", "");

        $mail = trim(strtolower($mail));

        $response = new JsonResponse(Array());

        $res = $this->get("app.user")->verifyMail($mail, $token, $code, false, $response);

        if ($res) {

            $data["data"]["status"] = "success";

            $device = $request->request->get("device", false);
            if ($device && isset($device["type"]) && isset($device["value"])) {
                $this->get("app.user")->addDevice($this->getUser()->getId(), $device["type"], $device["value"], isset($device["version"]) ? $device["version"] : null);
                $this->get("administration.counter")->incrementCounter("total_devices_linked", 1);
            }

            $this->get("administration.counter")->incrementCounter("total_users", 1);

        } else {

            $data["errors"][] = "error";

        }

        $response->setContent(json_encode($data));

        return $response;
    }

    /*
	public function subscribeAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		$code = $request->request->get("code", "");
		$token = $request->request->get("token", "");
		$username = $request->request->get("username", "");
        $password = $request->request->get("password", "");
        $name = $request->request->get("name", "");
        $firstname = $request->request->get("firstname", "");
        $phone = $request->request->get("phone", "");

		$res = $this->get("app.user")->subscribe($token, $code, $username, $password,$name,$firstname,$phone);

		if ($res || $this->get("app.user")->current()) {

			$data["data"]["status"] = "success";

		} else {

			$data["errors"][] = "badusername";

		}

		return new JsonResponse($data);

	}
    */

    public function getAvaibleAction(Request $request)
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

        return new JsonResponse($data);
    }

    public function subscribeTotalyAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $mail = $request->request->get("mail", "");
        $username = $request->request->get("username", "");
        $password = $request->request->get("password", "");
        $lastName = $request->request->get("lastName", "");
        $firstName = $request->request->get("firstName", "");
        $phone = $request->request->get("phone", "");
        $recaptcha = $request->request->get("recaptcha", "");
        $language = $request->request->get("language", "en");
        $origin = $request->request->get("origin", "");


        $res = $this->get("app.user")->subscribeInfo($mail, $password, $username, $firstName, $lastName, $phone, $recaptcha, $language, $origin);

        if ($res == true && is_bool($res)) {

            $data["data"]["status"] = "success";

        } elseif (is_array($res)) {
            if (in_array(-1, $res)) {

                $data["errors"][] = "mailalreadytaken";

            }
            if (in_array(-2, $res)) {

                $data["errors"][] = "usernamealreadytaken";

            }
        } else {
            $data["errors"][] = "error";
        }
        return new JsonResponse($data);
    }

    public function testMailAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $mail = $request->request->get("mail", "");

        $res = $this->get("app.user")->testMail($mail);

        $data["data"] = $res;

        return new JsonResponse($data);
    }


}