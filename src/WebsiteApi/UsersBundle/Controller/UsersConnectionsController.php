<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UsersConnectionsController extends Controller
{

	public function loginAction(Request $request)
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

			$data["data"]["status"] = "connected";

		} else {

			$data["data"]["status"] = "disconnected";

		}

		return new JsonResponse($data);

	}

	public function logoutAction(Request $request)
	{

		$this->get("app.user")->logout();
		return new JsonResponse(Array());

	}

	public function currentUserAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		$ok = $this->get("app.user")->current();
		if(!$ok){
			$data["errors"][] = "disconnected";
		}else{
			$data["data"] = $this->getUser()->getAsArray();

			$data["data"]["status"] = "connected";

			$workspaces = $this->getUser()->getWorkspaces();

			$groups = Array();
			foreach ($workspaces as $workspace) {
				if($workspace->getIsDeleted() == false){
					$groups[]
						= $workspace->getAsSimpleArray();
				}
			};

			$data["data"]["groups"] = $groups;

		}

		return new JsonResponse($data);

	}

}