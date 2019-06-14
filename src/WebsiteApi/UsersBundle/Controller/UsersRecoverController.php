<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UsersRecoverController extends Controller
{

	
	public function mailAction(Request $request)
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

		return new JsonResponse($data);

	}


	public function codeVerificationAction(Request $request)
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

		return new JsonResponse($data);

	}


	public function newPasswordAction(Request $request)
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

		return new JsonResponse($data);

	}

}