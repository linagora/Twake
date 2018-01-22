<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceUser;
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
				$this->get("app.user")->removeDevice($this->getUser()->getId(), $device["type"], $device["value"]);
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

			$workspacesObjs = $this->getUser()->getWorkspaces();

			$privateWorkspace = null;
			$workspaces = Array();
			foreach ($workspacesObjs as $workspace) {
				if($workspace->getIsDeleted() == false){
					if($workspace->getPrivateOwner()!=null) {
						$privateWorkspace
							= $workspace->getAsSimpleArray();
					}else{
						$workspaces[]
							= $workspace->getAsSimpleArray();
					}
				}
			};

			if($privateWorkspace == null){
				$doctrine = $this->getDoctrine()->getManager();

				//Create private ws
				$private = new Workspace();
				$private->setPrivateOwner($this->getUser());

				$doctrine->persist($private);
				$doctrine->flush();

				$userLink = new LinkWorkspaceUser();
				$userLink->setUser($this->getUser());
				$userLink->setGroup($private);

				$doctrine->persist($userLink);
				$doctrine->flush();

				$driveApp = $doctrine->getRepository('TwakeMarketBundle:Application')->findOneBy(Array('name' => "Drive"));

				$appLink = new LinkAppWorkspace();
				$appLink->setApplication($driveApp);
				$appLink->setGroup($private);

				$doctrine->persist($appLink);
				$doctrine->flush();

				$privateWorkspace = $private->getAsSimpleArray();
			}

			$data["data"]["workspaces"] = $workspaces;
			$data["data"]["privateworkspace"] = $privateWorkspace;

		}

		return new JsonResponse($data);

	}

}