<?php

namespace WebsiteApi\PaymentsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;

class DefaultController extends Controller {

	private function getAllChildren($group, $groupsAlreadyThreated = Array()) {

		if (!in_array($group, $groupsAlreadyThreated)) {

			$childsEntities = $group->getChildrenWorkspaces();
			$children = Array($group);

			foreach ($childsEntities as $child) {
				$subChildren = $this->getAllChildren($child, $children);
				foreach ($subChildren as $subchild) {
					if (!in_array($subchild, $children)) {
						$children[] = $subchild;
					}
				}
			}

			return $children;
		}

		return Array();
	}

	private function getGroupArray($group, $masterGroup, $groupsAlreadyThreated = Array()) {

		if (!in_array($group, $groupsAlreadyThreated)) {

			$childsDetails = Array();
			$childsEntities = $group->getChildrenWorkspaces();

			foreach ($childsEntities as $entity) {

				$applicationsPrice = 0;
				foreach ($entity->getApplications() as $application) {
					$applicationsPrice += $application->getPrice();
				}

				$childsDetails[] = Array(
					"details" => $entity->getAsSimpleArray(false),
					"membersCount" => $entity->getMemberCount(),
					"applicationsCount" => count($entity->getApplications()),
					"applicationsPrice" => $applicationsPrice,
					"paid" => $entity->getPaymaster() == $masterGroup,
					"children" => $this->getGroupArray($entity, $masterGroup, array_merge(Array($group), $childsEntities)),
				);
			}

			return $childsDetails;
		}

		return Array();
	}

    public function getGroupsAction(Request $request) {

    	$data = Array(
	        "data" => Array(),
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
	    } else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $group, "general:payments:view")) {
		    $data["errors"][] = "notallowed";
	    }
	    else {
		    $applicationsPrice = 0;
		    foreach ($group->getApplications() as $application) {
			    $applicationsPrice += $application->getPrice();
		    }

		    $data["data"] = Array(
			    "details" => $group->getAsSimpleArray(false),
			    "membersCount" => $group->getMemberCount(),
			    "applicationsCount" => count($group->getApplications()),
			    "applicationsPrice" => $applicationsPrice,
			    "paid" => $group->getPaymaster() == $group,
			    "children" => $this->getGroupArray($group, $group)
		    );
	    }

    	return new JsonResponse($data);
    }

	private function getApplicationsArray($groups) {

		$applications = Array();
		$treatedApplications = Array();

		foreach ($groups as $group) {
			foreach ($group->getApplications() as $application) {

				if (!in_array($application, $treatedApplications)) {
					$applications[] = Array(
						"details" => $application->getAsSimpleArray(),
						"userCount" => count($this->getApplicationUsers($groups, $application)),
						"price" => $application->getPrice()
					);
					$treatedApplications[] = $application;
				}
			}
		}

		return $applications;
	}

	private function getApplicationUsers($groups, $application) {

		$groupLevels = Array();
		foreach ($groups as $group) {
			foreach ($group->getLevels() as $level) {
				if (!in_array($level, $groupLevels) && in_array($application, $group->getApplications())) {
					$groupLevels[] = $level;
				}
			}
		}

		$users = Array();
		foreach ($groupLevels as $level) {
			if (/*$this->get('app.workspace_levels')->levelHasRight($level, $group,  $application->getName() . ':app:access')*/
			true
			) {  // TODO
				foreach ($level->getLinksMembers() as $linkMember) {
					if ($linkMember->getStatus() == "A" && !in_array($linkMember->getUser(), $users)) {
						$users[] = $linkMember->getUser();
					}
				}
			}
		}

		return $users;
	}

	private function getUsersMaxPriceLevel($groups, $pricesLevels) {

		$users = Array();

		for ($i = 0; $i < count($groups); ++$i) {
			$members = $groups[$i]->getMembersUsers();
			foreach ($members as $member) {
				if (!isset($users[$member->getId()]) || $users[$member->getId()] == null || ($pricesLevels[$i] != null && $pricesLevels[$i]->getId() > $users[$member->getId()]->getId())) {
					$users[$member->getId()] = $pricesLevels[$i];
				}
			}
		}

		return $users;
	}

	public function getDetailsAction(Request $request) {

		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		$groupId = $request->request->has("groupId") ? $request->request->get("groupId") : 0;
		$groupsIdToPay = $request->request->has("groupsIdToPay") ? $request->request->get("groupsIdToPay") : Array();

		$manager = $this->getDoctrine()->getManager();
		$group = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$groupId,"isDeleted"=>false));

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($group == null) {
			$data["errors"][] = "groupnotfound";
		} else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $group, "general:payments:view")) {
			$data["errors"][] = "notallowed";
		}
		else {

			$allChildren = $this->getAllChildren($group);
			$groups = Array();
			$pricesLevels = Array();
			foreach ($groupsIdToPay as $groupIdToPay => $priceLevelId) {
				$groupToPay = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$groupIdToPay,"isDeleted"=>false));
				$priceLevel = $manager->getRepository("TwakePaymentsBundle:PriceLevel")->find($priceLevelId);
				if ($groupToPay == null) {
					$data["errors"][] = "grouptopaynotfound";
					return new JsonResponse($data);
				}
				else if (!in_array($groupToPay, $allChildren)) {
					$data["errors"][] = "childgroupnotfound";
					return new JsonResponse($data);
				}
				else {
					$groups[] = $groupToPay;
					$pricesLevels[] = $priceLevel;
				}
			}

			$usersMaxLevel = $this->getUsersMaxPriceLevel($groups, $pricesLevels);
			$totalPrice = 0;
			foreach ($usersMaxLevel as $user => $level) {
				if ($level != null) {
					$totalPrice += $level->getPrice();
				}
			}

			$data["data"]["apps"] = $this->getApplicationsArray($groups);
			$data["data"]["usersTotalPrice"] = $totalPrice;
			$data["data"]["usersTotalCount"] = count($usersMaxLevel);
		}

		return new JsonResponse($data);
	}

	public function getPricesAction() {

		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		$manager = $this->getDoctrine()->getManager();

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else {

			$priceLevels = $manager->getRepository("TwakePaymentsBundle:PriceLevel")->findAll();
			foreach ($priceLevels as $level) {
				$data["data"][] = Array(
					"id" => $level->getId(),
					"name" => $level->getName(),
					"price" => $level->getPrice()
				);
			}
		}

		return new JsonResponse($data);
	}

	public function updateDetailsAction(Request $request) {

		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		$groupId = $request->request->has("groupId") ? $request->request->get("groupId") : 0;
		$groupsIdToPay = $request->request->has("groupsIdToPay") ? $request->request->get("groupsIdToPay") : Array(4358 => 4);

		$manager = $this->getDoctrine()->getManager();
		$group = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$groupId,"isDeleted"=>false));

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($group == null) {
			$data["errors"][] = "groupnotfound";
		} else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $group, "general:payments:edit")) {
			$data["errors"][] = "notallowed";
		}
		else {

			$allChildren = $this->getAllChildren($group);
			$groups = Array();
			$pricesLevels = Array();
			foreach ($groupsIdToPay as $groupIdToPay => $priceLevelId) {
				$groupToPay = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$groupIdToPay,"isDeleted"=>false));
				$priceLevel = $manager->getRepository("TwakePaymentsBundle:PriceLevel")->find($priceLevelId);
				if ($groupToPay == null) {
					$data["errors"][] = "grouptopaynotfound";
					return new JsonResponse($data);
				}
				else if (!in_array($groupToPay, $allChildren)) {
					$data["errors"][] = "childgroupnotfound";
					return new JsonResponse($data);
				}
				else {
					$groups[] = $groupToPay;
					$pricesLevels[] = $priceLevel;
				}
			}

			for ($i = 0; $i < count($groups); ++$i) {
				$groups[$i]->setPriceLevel($pricesLevels[$i]);
				$manager->persist($groups[$i]);
			}

			$manager->flush();
		}

		return new JsonResponse($data);
	}

	public function getHistoryAction(Request $request) {

		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		$groupId = $request->request->has("groupId") ? $request->request->get("groupId") : 0;

		$manager = $this->getDoctrine()->getManager();
		$group = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$groupId,"isDeleted"=>false));

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		} else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $group, "general:payments:view")) {
			$data["errors"][] = "notallowed";
		}
		else {
			$operations = $group->getPaymentsHistory();

			foreach ($operations as $operation) {
				$data["data"][] = $operation->getAsSimpleArray();
			}
		}

		return new JsonResponse($data);
	}
}
