<?php

namespace WebsiteApi\CallsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\CallsBundle\Entity\Call;
use WebsiteApi\CallsBundle\Entity\CallMember;

class CallsController extends Controller
{

	public function joinAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		$securityContext = $this->get('security.authorization_checker');
		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
			return new JsonResponse($data);
		}

        $discussionKey = $request->request->get("discussionkey");

		$token = $this->get("app.callSystem")->joinCall($this->getUser(), $discussionKey);

		if ($token == null) {
			$data["errors"][] = "Unknown error";
		} else {
			$data["data"]["token"] = $token;
		}
		return new JsonResponse($data);
	}

	public function getAction(Request $request){

		$data = Array(
			"status" => "nocall",
			"members" => []
		);

        $discussionKey = $request->request->get("discussionkey");

        $securityContext = $this->get('security.authorization_checker');
        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data["status"] = "notconnected";
            return new JsonResponse($data);
        }

		$data = $this->get("app.callSystem")->getCallInfo($this->getUser(), $discussionKey);

		if ($data == null) {
			$data["errors"][] = "Unknown error";
		} else {
			$data["data"] = $data;
		}

		return new JsonResponse($data);

	}

	public function exitAction(){


		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

        $securityContext = $this->get('security.authorization_checker');
        if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $data["errors"][] = "notconnected";
            return new JsonResponse($data);
        }

		$this->get("app.callSystem")->exitCalls($this->getUser());
        error_log("end exit controler");
        return new JsonResponse($data);
	}

}
