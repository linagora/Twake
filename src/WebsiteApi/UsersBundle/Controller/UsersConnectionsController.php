<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;

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

		$response = new JsonResponse();
		$loginResult = $this->get("app.user")->login($usernameOrMail, $password, $rememberMe, $request, $response);

		if ($loginResult) {

			$device = $request->request->get("device", false);
			if($device) {
				$this->get("app.user")->addDevice($this->getUser()->getId(), $device["type"], $device["value"]);
			}

			$data["data"]["status"] = "connected";

		} else {

			$data["data"]["status"] = "disconnected";

		}

		$response->setContent(json_encode($data));

		return $response;

	}

	public function logoutAction(Request $request)
	{

		$device = $request->request->get("device", false);
		if($device) {
			$this->get("app.user")->removeDevice($this->getUser()->getId(), $device["type"], $device["value"]);
		}
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

			$private = $this->get("app.workspaces")->getPrivate($this->getUser()->getId());
			$workspaces_obj = $this->get("app.workspace_members")->getWorkspaces($this->getUser()->getId());

			$workspaces = Array();
			foreach ($workspaces_obj as $workspace_obj){
				$workspaces[] = $workspace_obj->getAsArray();
			}

			$data["data"]["workspaces"] = $workspaces;
			$data["data"]["privateworkspace"] = $private->getAsArray();

		}

		return new JsonResponse($data);

	}

}