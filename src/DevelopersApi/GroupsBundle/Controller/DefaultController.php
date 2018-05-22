<?php

namespace DevelopersApi\GroupsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class DefaultController extends Controller
{

	public function getUsersAction(Request $request)
	{
		$request = $this->get("api.CheckRightApplication")->getRequestData($request);
		$requestData = $request["data"];
		if (isset($requestData["errors"])) {
			return new JsonResponse($requestData["errors"]);
		}
		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		$fields = $requestData["fields"];

		$workspaceId = $request["workspace"]->getId();
		$users = $this->get("app.workspace_members")->getMembers($workspaceId);

		foreach ($users as $userObj) {
			$user = $userObj["user"];

			$userArray = $user->getAsArray();
			$userData = Array("id" => $user->getId());

			foreach ($fields as $field) {
				if (isset($userArray[$field])) {
					$userData[$field] = $userArray[$field];
				}
				else if ($field == "userImage"){
                    $pimage = $user->getThumbnail();
                    if ($pimage) {
                        $userData[$field] = $this->getParameter('SERVER_NAME') . $pimage->getPublicURL(2);
                    }
                    else{
                        $userData[$field] = "";
                    }
                }

            }
			$data["data"][] = $userData;
		}

		return new JsonResponse($data);
	}

}
