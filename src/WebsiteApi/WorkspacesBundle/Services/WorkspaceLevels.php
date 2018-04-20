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

		if($workspace->getUser() != null && $workspace->getUser()->getId()==$user->getId()){
			return true;
		}

		$link = $workspaceUserRepository->findOneBy(Array("user"=>$user, "workspace"=>$workspace));

		if(!$link || !$link->getLevel()){
			return false;
		}

		if($link->getLevel()->getisAdmin()){
			return true; //Admin can do everything
		}

		if($action=="" || $action==null){
			return true;
		}

		$rights = $link->getLevel()->getRights();

		//Compare with action asked
		$actions = explode(":", $action);
		$object = $actions[0];
		$value = intval(str_replace(Array("none", "read", "write", "manage"),Array(0,1,2,3),$actions[1]));

		error_log($object." ".$value);

		if(!isset($rights[$object]) || intval(str_replace(Array("none", "read", "write", "manage"),Array(0,1,2,3),$rights[$object])) <= $value){
            return false;
        }
        error_log("TRUE");

        return true;

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
			|| $this->can($workspaceId, $currentUserId, "workspace:write")
		){

			$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");

			$level = $levelRepository->find($levelId);
			if(!$level){
				return false;
			}

			if($level->getWorkspace()->getId() != $workspaceId){
				return false;
			}

			$level->setRights($rights);
			$level->setLabel($label);

			$this->doctrine->persist($level);
			$this->doctrine->flush();

			return true;

		}

		return false;
	}

	public function getDefaultLevel($workspaceId)
	{
		$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
		$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

		$workspace = $workspaceRepository->find($workspaceId);

		return $levelRepository->findOneBy(Array("workspace"=>$workspace, "isDefault"=>true));

	}

	public function setDefaultLevel($workspaceId, $levelId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->can($workspaceId, $currentUserId, "workspace:write")
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
			|| $this->can($workspaceId, $currentUserId, "workspace:write")
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
			|| $this->can($workspaceId, $currentUserId, "workspace:write")
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

    public function fixLevels($levels, $workspaceApps)
    {
        $list = Array();
        $list["levels"] = Array();
        foreach ($levels as $level) {
            $list["levels"][] = $level->getAsArray();
        }
        foreach ($list["levels"] as $k => $levelvalue) {
            //for each level, get the workspace'apps and check differencies between rights and apps
            if ($levelvalue["rights"] == null) {
                $levelvalue["rights"] = Array();
            }
            $rights_fixed = Array();
            foreach ($workspaceApps as $app) {
                if(!array_key_exists($app->getPublicKey(),$levelvalue["rights"]) || $levelvalue["admin"]){
                    $rights_fixed[$app->getPublicKey()] = "manage";
                }else{
                    $rights_fixed[$app->getPublicKey()] = $levelvalue["rights"][$app->getPublicKey()]  ;
                }
            }
            if($levelvalue["admin"]){
                $rights_fixed["workspace"] = $levelvalue["admin"]?"manage":$levelvalue["rights"]["workspace"];
            }else {
                if (!array_key_exists("workspace", $levelvalue["rights"])) {
                    $rights_fixed["workspace"] = "none";
                } else {
                    $rights_fixed["workspace"] = $levelvalue["rights"]["workspace"];
                }
            }
            $list["levels"][$k]["rights"] = $rights_fixed;
        }

        return $list;
    }



	// @Depreciated
	public function hasRight($userId, $workspaceId, $rightAsked)
	{
		if(!is_int($userId)){
			$userId = $userId->getId();
		}
		if(!is_int($workspaceId)){
			$workspaceId = $workspaceId->getId();
		}
		return $this->can($workspaceId, $userId, $rightAsked);
	}

	// @Depreciated
	public function errorsAccess($userId, $workspaceId, $right)
	{
		if(!is_int($userId)){
			$userId = $userId->getId();
		}
		if(!is_int($workspaceId)){
			$workspaceId = $workspaceId->getId();
		}
		if($this->can($workspaceId, $userId, $right)){
			return [];
		}
		return ["notallowed"];
	}

}

?>