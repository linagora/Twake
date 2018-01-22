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

		$res = $this->get("app.user")->subscribeMail($email);

		if ($res) {

			$data["data"]["token"] = $res;

		} else {

			$data["errors"][] = "alreadyused";

		}

		return new JsonResponse($data);

	}


	public function verifyMailAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		$code = $request->request->get("code", "");
		$token = $request->request->get("token", "");

		$res = $this->get("app.user")->checkNumberForSubscribe($token, $code);

		if ($res) {

			$data["data"]["status"] = "success";

		} else {

			$data["errors"][] = "badcode";

		}

		return new JsonResponse($data);

	}


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

		$res = $this->get("app.user")->subscribe($token, $code, $username, $password);

		if ($res) {

			$data["data"]["status"] = "success";

		} else {

			$data["errors"][] = "badusername";

		}

		return new JsonResponse($data);

	}


}