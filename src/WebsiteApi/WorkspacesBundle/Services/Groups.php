<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\GroupManager;
use WebsiteApi\WorkspacesBundle\Model\GroupsInterface;

class Groups implements GroupsInterface
{

	private $doctrine;
	private $gms;

	public function __construct($doctrine, $group_managers_service)
	{
		$this->doctrine = $doctrine;
		$this->gms = $group_managers_service;
	}

	public function create($userId, $name, $uniquename, $planId)
	{
		$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
		$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");

		$user = $userRepository->find($userId);

		$groupUsingThisName = $groupRepository->findOneBy(Array("name" => $uniquename));

		if($groupUsingThisName){
			return false;
		}

		$group = new Group($uniquename);
		$group->setDisplayName($name);
		$group->setPricingPlan($planId);

		$this->doctrine->persist($group);
		$this->doctrine->flush();

		$manager = new GroupManager($group, $user);

		$this->doctrine->persist($manager);
		$this->doctrine->flush();

		return $group;

	}

	public function changeData($groupId, $name, $thumbnailFile, $currentUserId = null)
	{
		if($currentUserId==null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_DATA")){

			$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
			$group = $groupRepository->find($groupId);

			$group->setDisplayName($name);
			$group->setLogo($thumbnailFile);

			$this->doctrine->persist($group);
			$this->doctrine->flush();

			return true;
		}

		return false;
	}

	public function changePlan($groupId, $planId, $currentUserId = null)
	{
		if($currentUserId==null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_PRICINGS")){

			$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
			$group = $groupRepository->find($groupId);

			$pricingPlanRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:PricingPlan");
			$pricingPlan = $pricingPlanRepository->find($planId);

			$group->setPricingPlan($pricingPlan);

			$this->doctrine->persist($group);
			$this->doctrine->flush();

			return true;
		}

		return false;
	}

	public function removeUserFromGroup($groupId, $userId, $currentUserId = null)
	{
		if($currentUserId==null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_USERS")){

			$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$user = $userRepository->find($userId);

			$ws = $this->getWorkspaces($groupId);//TODO remove users from all workspaces

			$workspace_ids = Array();
			foreach ($ws as $workspace){
				$workspace_ids[] = $workspace->getId();
			}

			$this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->deleteUserFromGroup($workspace_ids, $user);

			return true;
		}

		return false;
	}

	public function getWorkspaces($groupId, $currentUserId=null)
	{
		if($currentUserId==null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "VIEW_WORKSPACES")){

			$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
			$group = $groupRepository->find($groupId);

			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

			return $workspaceRepository->findBy(Array("group"=>$group));
		}

		return false;
	}

	public function getUsers($groupId, $currentUserId=null)
	{
		if($currentUserId==null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "VIEW_WORKSPACES")){

			$ws = $this->getWorkspaces($groupId);//TODO remove users from all workspaces

			$workspace_ids = Array();
			foreach ($ws as $workspace){
				$workspace_ids[] = $workspace->getId();
			}

			$userLinks = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->getUsersFromGroup($workspace_ids);

			$users = Array();
			foreach ($userLinks as $userLink){
				$users[] = $userLink->getUser();
			}

			return $users;
		}

		return false;
	}
}