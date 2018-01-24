<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\WorkspacesBundle\Entity\WorkspaceLevel;
use WebsiteApi\WorkspacesBundle\Model\WorkspaceLevelsInterface;

class WorkspaceLevels implements WorkspaceLevelsInterface
{

	private $doctrine;

	public function __construct($doctrine)
	{
		$this->doctrine = $doctrine;
	}

	public function can($workspaceId, $userId, $action)
	{
		//Load rights for this users

		$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
		$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
		$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

		$user = $userRepository->find($userId);
		$workspace = $workspaceRepository->find($workspaceId);

		if(!$user || !$workspace){
			return false;
		}

		$link = $workspaceUserRepository->findOneBy(Array("user"=>$user, "workspace"=>$workspace));

		if(!$link || !$link->getLevel()){
			return false;
		}

		if($link->getLevel()->getisAdmin()){
			return true; //Admin can do everything
		}

		$rights = $link->getLevel()->getRights();

		//Compare with action asked
		$actions = explode(":", $action);

		foreach ($actions as $action){
			if(!isset($rights[$action]) || $rights[$action] == false){ // If not in tree or false no right
				return false;
			}
			if($rights[$action] == true){ // If true so authorized
				return true;
			}
			$rights = $rights[$action]; // Else continue in the tree
		}

		return false; //We did not found any true leaf, so false

	}

	public function getLevel($workspaceId, $userId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $currentUserId == $userId
			|| $this->can($workspaceId, $currentUserId, "levels:view")
		){

			$userRepository = $this->doctrine->getRepository("TwakeUsersBundle:User");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

			$user = $userRepository->find($userId);
			$workspace = $workspaceRepository->find($workspaceId);
			$link = $workspaceUserRepository->findOneBy(Array("user"=>$user, "workspace"=>$workspace));

			if(!$link){
				return null; //No level because no member
			}

			return $link->getLevel();

		}

		return null; //Cant look this info
	}

	public function updateLevel($workspaceId, $levelId, $label, $rights, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->can($workspaceId, $currentUserId, "levels:edit")
		){

			$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");

			$level = $levelRepository->find($levelId);
			if(!$level){
				return false;
			}

			if($level->getWorkspace()->getId() != $workspaceId){
				return false;
			}

			if($level->getisAdmin()){
				return false; //Can't edit admin level (all rights)
			}

			$level->setRights($rights);
			$level->setLabel($label);

			$this->doctrine->persist($level);
			$this->doctrine->flush();

			return true;

		}

		return false;
	}

	public function setDefaultLevel($workspaceId, $levelId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->can($workspaceId, $currentUserId, "levels:edit")
		){

			$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

			$workspace = $workspaceRepository->find($workspaceId);

			$oldLevelDefault = $levelRepository->findOneBy(Array("workspace"=>$workspace, "isDefault"=>true));

			if($oldLevelDefault) {
				$oldLevelDefault->setisDefault(false);
				$this->doctrine->persist($oldLevelDefault);
			}

			$levelDefault = $levelRepository->find($levelId);
			if(!$levelDefault){
				return false;
			}
			if($levelDefault->getWorkspace()->getId() != $workspaceId){
				return false;
			}
			$levelDefault->setisDefault(true);


			$this->doctrine->persist($levelDefault);
			$this->doctrine->flush();

			return true;

		}

		return false;
	}

	public function addLevel($workspaceId, $label, $rights, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->can($workspaceId, $currentUserId, "levels:edit")
		){

			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspace = $workspaceRepository->find($workspaceId);

			$level = new WorkspaceLevel();

			$level->setWorkspace($workspace);
			$level->setRights($rights);
			$level->setLabel($label);

			$this->doctrine->persist($level);
			$this->doctrine->flush();

			return true;

		}

		return false;
	}

	public function removeLevel($workspaceId, $levelId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->can($workspaceId, $currentUserId, "levels:edit")
		){

			$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

			$level = $levelRepository->find($levelId);
			if($level->getWorkspace()->getId() != $workspaceId){
				return false;
			}

			if($level->getisDefault()){
				return false; //Can't remove default level
			}

			if($level->getisAdmin()){
				return false; //Can't remove admin level
			}

			$workspace = $workspaceRepository->find($workspaceId);
			$levelDefault = $levelRepository->findOneBy(Array("workspace"=>$workspace, "isDefault"=>true));

			if(!$levelDefault){
				return false;
			}

			$affectedUsers = $workspaceUserRepository->findBy(Array("workspace"=>$workspace, "level"=>$level));
			foreach ($affectedUsers as $affectedUser){
				$affectedUser->setLevel($levelDefault);
				$this->doctrine->persist($affectedUser);
			}

			$this->doctrine->remove($level);
			$this->doctrine->flush();

			return true;

		}

		return false;
	}

	public function getUsers($workspaceId, $levelId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->can($workspaceId, $currentUserId, "levels:view")
		) {

			$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

			$level = $levelRepository->find($levelId);
			$workspace = $workspaceRepository->find($workspaceId);

			if (!$level || !$workspace) {
				return false;
			}

			$link = $workspaceUserRepository->findBy(Array("level" => $level, "workspace" => $workspace));

			$users = Array();
			foreach($link as $user){
				$users[] = $user->getUser();
			}

			return $users;
		}

		return false;
	}

	public function getLevels($workspaceId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->can($workspaceId, $currentUserId, "levels:view")
		) {

			$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

			$workspace = $workspaceRepository->find($workspaceId);

			if (!$workspace) {
				return false;
			}

			$levels = $levelRepository->findBy(Array("workspace" => $workspace));

			return $levels;
		}

		return false;
	}
}