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

		$manager = $this->getDoctrine()->getManager();

		$fields = $requestData["fields"];

		$users = $request["group"]->getMembersUsers();

		foreach ($users as $user) {
			$userArray = $user->getAsSimpleArray();
			$userData = Array("id" => $user->getId());
			foreach ($fields as $field) {
				if (isset($userArray[$field])) {
					$userData[$field] = $userArray[$field];
				}
				else if ($field == "userImage"){
                    $pimage = $user->getProfileImage();
                    if ($pimage) {
                        $userData[$field] = "https://twakeapp.com" . $pimage->getPublicURL(2);
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
