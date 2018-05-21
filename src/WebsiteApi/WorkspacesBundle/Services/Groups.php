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
    private $string_cleaner;
    private $gps;
    private $wms;

	public function __construct($doctrine, $group_managers_service, $market_service,$clean,$group_period_service,$workspace_member_service)
	{
		$this->doctrine = $doctrine;
		$this->gms = $group_managers_service;
		$this->market = $market_service;
		$this->string_cleaner = $clean;
		$this->gps = $group_period_service;
        $this->wms = $workspace_member_service;
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

        $this->gms->addManager($group->getId(), $userId, 3, true);

		$this->init($group);
		$this->gps->init($group);

		return $group;

	}

	public function changeData($groupId, $name, $currentUserId = null)
	{
		if($currentUserId==null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_DATA")){

			$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
			$group = $groupRepository->find($groupId);

			$group->setDisplayName($name);

            //Find a name
            $groupUsingThisName = $groupRepository->findOneBy(Array("name" => $name));
            $increment = 0;
            $uniquenameIncremented = $this->string_cleaner->simplify($name);

            while($groupUsingThisName!=null) {
                $groupUsingThisName = $groupRepository->findOneBy(Array("name" => $uniquenameIncremented));
                $increment+=1;
                if($groupUsingThisName!=null){
                    $uniquenameIncremented = $name."-".$increment;
                }
            }

            $group->setName($uniquenameIncremented);

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

			$ws = $this->getWorkspaces($groupId);

			foreach ($ws as $workspace){
			    $this->wms->removeMember($workspace->getId(), $userId, $currentUserId);
			}

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

    public function remove($group){

	    //TODO REMOVE USERS FROM WORKSPACE
        if ($group != null){
            $groupappsRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupApp");
            $groupapps = $groupappsRepository->findBy(Array("group" => $group));

            $workspaceRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Workspace");
            $workspace = $workspaceRepository->findOneBy(Array("name" => "phpunit"));

            $workspaceUserRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
            $workspaceUsers = $workspaceUserRepository->findBy(Array("workspace" => $workspace));

            $workspaceappsRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
            $workspaceapps = $workspaceappsRepository->findBy(Array("workspace" => $workspace));

            $workspacelevelRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
            $workspacelevels = $workspacelevelRepository->findBy(Array("workspace" => $workspace));

            $workspacestatsRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceStats");
            $workspacestats = $workspacestatsRepository->findOneBy(Array("workspace" => $workspace));

            $streamRepository = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Stream");
            $streams = $streamRepository->findBy(Array("workspace" => $workspace));

            $groupUserdRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupUser");
            $groupUsers = $groupUserdRepository->findBy(Array("group" => $group));

            $groupPeriodRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupPeriod");
            $groupPeriod = $groupPeriodRepository->findOneBy(Array("group" => $group));

            $groupPricingRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupPricingInstance");
            $groupPricing = $groupPricingRepository->findOneBy(Array("group" => $group));

            $closedGroupPeriodRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:closedGroupPeriod");
            $closedGroupPeriods = $closedGroupPeriodRepository->findBy(Array("group" => $group));
        }

        //TODO DOCTRINE REMOVE USERS FROM WORKSPACE

        if ($group != null){
            if ($groupapps != null ){
                if (is_array($groupapps)){
                    foreach($groupapps as $groupapp){
                        $this->getDoctrine()->remove($groupapp);
                    }
                }
            }
            if ($workspaceapps != null ) {
                if (is_array($workspaceapps)) {
                    foreach ($workspaceapps as $workspaceapp) {
                        $this->getDoctrine()->remove($workspaceapp);
                    }
                }
            }
            if ($workspaceUsers != null ) {
                if (is_array($workspaceUsers)) {
                    foreach ($workspaceUsers as $workspaceUser) {
                        $this->getDoctrine()->remove($workspaceUser);
                    }
                }
            }
            if($groupPricing != null){
                $this->getDoctrine()->remove($groupPricing);
            }
            if ($closedGroupPeriods != null ) {
                if (is_array($closedGroupPeriods)) {
                    foreach ($closedGroupPeriods as $closedGroupPeriod) {
                        $this->getDoctrine()->remove($closedGroupPeriod);
                    }
                }
            }
            if ($workspacelevels != null ) {
                if (is_array($workspacelevels)) {
                    foreach ($workspacelevels as $workspacelevel) {
                        $this->getDoctrine()->remove($workspacelevel);
                    }
                }
            }
            if ($streams != null ) {
                if (is_array($streams)) {
                    foreach ($streams as $stream) {
                        $this->getDoctrine()->remove($stream);
                    }
                }
            }
            if($workspacestats != null){
                $this->getDoctrine()->remove($workspacestats);
            }
            if($workspace != null){
                $this->getDoctrine()->remove($workspace);
            }
            if (is_array($groupUsers)){
                foreach($groupUsers as $groupUser){
                    $this->getDoctrine()->remove($groupUser);
                }
            }
            if($groupPeriod != null){
                $this->getDoctrine()->remove($groupPeriod);
            }
        }

        if($group != null){
            $this->getDoctrine()->remove($group);
        }

        $this->getDoctrine()->flush();
    }

    public function countUsersGroup($groupId)
    {
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");

        $group = $groupRepository->find($groupId);
        $managers = $groupManagerRepository->findBy(Array("group" => $group));

        return count($managers);

    }

    public function getUsersGroup($groupId,$onlyExterne,$limit, $offset,$currentUserId = null)
    {
        if($currentUserId==null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "VIEW_USERS")){

            $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
            $groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");

            $group = $groupRepository->find($groupId);
            if($onlyExterne){
                $managerLinks = $groupManagerRepository->getExternalUsers($group,$limit,$offset);
            }else{
                $managerLinks = $groupManagerRepository->getUsers($group,$limit,$offset);
            }

            $users = Array();
            foreach ($managerLinks as $managerLink){
                $users[] = Array(
                    "user" => $managerLink->getUser(),
                    "externe" => $managerLink->getExterne(),
                    "level" => $managerLink->getLevel()
                );
            }
            return $users;

        }

        return false;


    }

    public function editUserFromGroup($groupId,$userId,$externe,$currentUserId = null)
    {
        if($currentUserId==null || $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_USERS")){

            $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
            $groupManagerRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");

            $group = $groupRepository->find($groupId);
            $user = $groupManagerRepository->findOneBy(Array("group" => $group, "user" => $userId ));

            $user->setExterne($externe);
            $this->doctrine->persist($user);
            $this->doctrine->flush();
            return true;
            }

        return false;
    }

}