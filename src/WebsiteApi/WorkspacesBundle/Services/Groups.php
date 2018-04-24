<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\GroupManager;
use WebsiteApi\WorkspacesBundle\Model\GroupsInterface;
use WebsiteApi\WorkspacesBundle\Entity\GroupApp;

class Groups implements GroupsInterface
{

	private $doctrine;
	private $gms;
    private $market;

	public function __construct($doctrine, $group_managers_service, $market_service)
	{
		$this->doctrine = $doctrine;
		$this->gms = $group_managers_service;
		$this->market = $market_service;
	}

	public function create($userId, $name, $uniquename, $planId)
	{
		$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
		$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
		$planRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:PricingPlan");

		$user = $userRepository->find($userId);
		$plan = $planRepository->find($planId);

		//Find a name
		$groupUsingThisName = $groupRepository->findOneBy(Array("name" => $uniquename));
		$increment = 0;
		$uniquenameIncremented = $uniquename;
		while($groupUsingThisName!=null) {
			$groupUsingThisName = $groupRepository->findOneBy(Array("name" => $uniquenameIncremented));
			$increment+=1;
			if($groupUsingThisName!=null){
				$uniquenameIncremented = $uniquename."-".$increment;
			}
		}

		$group = new Group($uniquenameIncremented);
		$group->setDisplayName($name);
		$group->setPricingPlan($plan);

		$this->doctrine->persist($group);
		$this->doctrine->flush();

		$this->gms->addManager($group->getId(), $userId, 3);

		$this->init($group);

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

    public function init($group){
        $appRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $groupAppRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");

        $groupApps = $groupAppRepository->findBy(Array("group" => $group));

        $listApps = $appRepository->findBy(Array("default"=>true));

        if(count($groupApps) != 0){
            return false;
        }else{
            foreach ( $listApps as $app ){
                $this->market->addApplication($group->getId(),$app->getId(),null,true);
            }
            $this->doctrine->flush();
            return true;
        }
    }
}