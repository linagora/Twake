<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\DiscussionBundle\Entity\Stream;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceLevel;
use WebsiteApi\WorkspacesBundle\Model\WorkspacesInterface;

class Workspaces implements WorkspacesInterface
{

	private $wls;
	private $wms;
	private $gms;
	private $gas;
	private $doctrine;

	public function __construct($doctrine, $workspaces_levels_service, $workspaces_members_service, $groups_managers_service, $groups_apps_service)
	{
		$this->doctrine = $doctrine;
		$this->wls = $workspaces_levels_service;
		$this->wms = $workspaces_members_service;
		$this->gms = $groups_managers_service;
		$this->gas = $groups_apps_service;
	}

	public function getPrivate($userId = null)
	{
		$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
		$user = $userRepository->find($userId);

		if(!$user){
			return null;
		}

		$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
		$workspace = $workspaceRepository->findOneBy(Array("user"=>$user));

		if(!$workspace){
			$workspace = $this->create("private_workspace", null, $userId);
			$workspace->setUser($user);
			$this->doctrine->persist($workspace);
			$this->doctrine->flush();
		}

		return $workspace;

	}

	public function create($name, $groupId = null, $userId = null)
	{

		$workspace = new Workspace($name);

		if($groupId!=null){
			$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
			$group = $groupRepository->find($groupId);

			$workspace->setGroup($group);
		}

		$this->doctrine->persist($workspace);
		$this->doctrine->flush();

		// Create stream
        $streamGeneral = new Stream($workspace,"General",false,"This is the general stream");
        $streamRandom = new Stream($workspace,"Random",false,"This is the random stream");

        $this->doctrine->persist($streamGeneral);
        $this->doctrine->persist($streamRandom);


		//Create admin level
		$level = new WorkspaceLevel();
		$level->setWorkspace($workspace);
		$level->setLabel("Administrator");
		$level->setIsAdmin(true);
		$level->setIsDefault(true);

		$this->doctrine->persist($level);
		$this->doctrine->flush();

		//Add user in workspace
		if($userId != null){
			$this->wms->addMember($workspace->getId(), $userId, $level->getId());
		}

		return $workspace;

	}

	public function remove($groupId, $workspaceId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "workspace:edit")
			|| $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_WORKSPACES")
		){
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspace = $workspaceRepository->find($workspaceId);

			$this->doctrine->remove($workspace);
			$this->doctrine->flush();
		}
	}
	public function changeData($workspaceId, $name, $thumbnailFile, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "workspace:edit")
		){

			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspace = $workspaceRepository->find($workspaceId);

			$workspace->setName($name);
			$workspace->setLogo($thumbnailFile);

			$this->doctrine->persist($workspace);
			$this->doctrine->flush();

		}
	}

	public function get($workspaceId, $currentUserId = null)
	{

		if($currentUserId==null
		  || $this->wls->can($workspaceId, $currentUserId, "")){
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspace = $workspaceRepository->find($workspaceId);
			return $workspace;
		}

		return false;
	}

	public function getApps($workspaceId, $currentUserId = null)
	{
		$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
		$workspace = $workspaceRepository->find($workspaceId);

		if($workspace==null){
			return false;
		}

		if($currentUserId==null
			|| $this->wls->can($workspaceId, $currentUserId, "")) {

			if ($workspace->getUser() != null
				&& ($workspace->getUser()->getId() == $currentUserId || $currentUserId == null)
			) {
				//Private ws apps
				//TODO
				$appRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
				return $appRepository->findBy(Array());
			}

			//Group apps
			return $this->gas->getApps($workspace->getGroup()->getId(), $currentUserId);

		}

		return false;

	}

}