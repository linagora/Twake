<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use WebsiteApi\WorkspacesBundle\Model\WorkspaceMembersInterface;

class WorkspaceMembers implements WorkspaceMembersInterface
{

	private $wls;
	private $doctrine;

	public function __construct($doctrine, $workspaces_levels_service)
	{
		$this->doctrine = $doctrine;
		$this->wls = $workspaces_levels_service;
	}

	public function changeLevel($workspaceId, $userId, $levelId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "members:edit")
		){
			$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");

			$level = $levelRepository->find($levelId);
			$user = $userRepository->find($userId);
			$workspace = $workspaceRepository->find($workspaceId);

			if($workspace->getUser() != null){
				return false; //Private workspace, only one user as admin
			}

			$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
			$member = $workspaceUserRepository->findOneBy(Array("workspace"=>$workspace, "user"=>$user));

			$member->setLevel($level);

			$this->doctrine->persist($member);
			$this->doctrine->flush();

			return true;
		}

		return false;
	}

	public function addMember($workspaceId, $userId, $levelId = null, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "members:edit")
		){

			$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

			$user = $userRepository->find($userId);
			$workspace = $workspaceRepository->find($workspaceId);

			if($workspace->getUser() != null){
				return false; //Private workspace, only one user
			}

			if(!$levelId) {
				$level = $this->wls->getDefaultLevel($workspaceId);
			}else{
				$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
				$level = $levelRepository->find($levelId);
			}

			$member = new WorkspaceUser($workspace, $user, $level);

			$this->doctrine->persist($member);
			$this->doctrine->flush();

			return true;
		}

		return false;
	}

	public function removeMember($workspaceId, $userId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "members:edit")
		){

			if($userId == $currentUserId){
				return false; // can't remove myself
			}

			$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

			$user = $userRepository->find($userId);
			$workspace = $workspaceRepository->find($workspaceId);

			if($workspace->getUser() != null){
				return false; //Private workspace, only one user
			}

			$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
			$member = $workspaceUserRepository->findOneBy(Array("workspace"=>$workspace, "user"=>$user));

			$this->doctrine->remove($member);
			$this->doctrine->flush();

			return true;
		}

		return false;
	}

	public function getMembers($workspaceId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "members:view")
		){
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

			$workspace = $workspaceRepository->find($workspaceId);

			if (!$workspace) {
				return false;
			}

			$link = $workspaceUserRepository->findBy(Array("workspace" => $workspace));

			$users = Array();
			foreach($link as $user){
				$users[] = $user->getUser();
			}

			return $users;
		}

		return false;
	}

	public function getWorkspaces($userId)
	{
		$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
		$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");

		$user = $userRepository->find($userId);

		if (!$user) {
			return false;
		}

		$link = $workspaceUserRepository->findBy(Array("user" => $user));

		$workspaces = Array();
		foreach($link as $workspace){
			$workspaces[] = $workspace->getWorkspace();
		}

		return $workspaces;
	}
}