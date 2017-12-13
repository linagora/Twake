<?php

namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Constraints\Email;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceSubscription;
use WebsiteApi\UsersBundle\Entity\Mail;

class UserSubscriptionController extends Controller
{
	public function setAction(Request $request) {

		$data = Array(
			"errors" => Array()
		);

		$groupId = $request->request->has("groupId") ? $request->request->get("groupId") : 0;

		$manager = $this->getDoctrine()->getManager();
		$group = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$groupId,"isDeleted"=>false));

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($group == null) {
			$data["errors"][] = "groupnotfound";
		}
		else if (in_array($this->getUser(), $group->getMembersUsers())) {
			$data["errors"][] = "alreadyingroup";
		}
		else {

			$subscription = $manager->getRepository("TwakeWorkspacesBundle:WorkspaceSubscription")->findOneBy(
				Array("workspace" => $groupId, "user" => $this->getUser())
			);

			if ($subscription == null) {
				$subscription = new WorkspaceSubscription($group, $this->getUser());
				$manager->persist($subscription);
			}
			else {
				$manager->remove($subscription);
			}

			$manager->flush();
		}

		return new JsonResponse($data);
	}

	public function getAction(Request $request) {

		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		$userId = $request->request->has("userId") ? $request->request->get("userId") : 0;

		$manager = $this->getDoctrine()->getManager();
		$user = $manager->getRepository("TwakeUsersBundle:User")->find($userId);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($user == null) {
			$data["errors"][] = "usernotfound";
		}
		else {

			if ($user == $this->getUser() || $user->getPrivacy("subscriptions") == "public"
				|| (in_array($this->getUser(), $user->getContacts()) && $user->getPrivacy("subscriptions") == "protected"))
			{
				$subscriptions = $user->getSubscriptions();

				foreach ($subscriptions as $subscription) {
					$data["data"][] = $subscription->getWorkspace()->getAsSimpleArray(false);
				}
			}
		}

		return new JsonResponse($data);
	}
}
