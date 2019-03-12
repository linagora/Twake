<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\WorkspacesBundle\Entity\WorkspaceLevel;
use WebsiteApi\WorkspacesBundle\Model\WorkspaceLevelsInterface;

class WorkspaceLevels implements WorkspaceLevelsInterface
{

	private $doctrine;
    private $pusher;

    public function __construct($doctrine, $pusher)
	{
		$this->doctrine = $doctrine;
        $this->pusher = $pusher;
	}


    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = $var; // Cassandra id do nothing
        }

        if (is_int($var) || is_string($var) || get_class($var) == "Ramsey\Uuid\Uuid") {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }

	public function can($workspaceId, $userId, $action)
	{

        if (!$userId) {
            return false;
        }

		//Load rights for this users

		$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
		$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

        $user = $this->convertToEntity($userId, "TwakeUsersBundle:User");
		$workspace = $workspaceRepository->find($workspaceId);

		if(!$user || !$workspace){
            error_log("no user / ws ");
			return false;
		}

		if($workspace->getUser() != null && $workspace->getUser()->getId()==$user->getId()){
			return true;
		}

		$link = $workspaceUserRepository->findOneBy(Array("user"=>$user, "workspace"=>$workspace));
		if($link){
            $level = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel")->findOneBy(Array("workspace"=>$workspace->getId(),"id"=>$link->getLevel()));
            if(!$link || !$level){
                return false;
            }

            $workspace->setTotalActivity($workspace->getTotalActivity() + 1);
            $this->doctrine->persist($workspace);
            //No flush, if this is just a read we don't count the activity

            if($level->getIsAdmin()){
                return true; //Admin can do everything
            }

            if($action=="" || $action==null){
                return true;
            }

            $rights = $level->getRights();

            //Compare with action asked
            $actions = explode(":", $action);
            $object = $actions[0];
            $value = intval(str_replace(Array("none", "read", "write", "manage"),Array(0,1,2,3),$actions[1]));

            if(!isset($rights[$object]) || intval(str_replace(Array("none", "read", "write", "manage"),Array(0,1,2,3),$rights[$object])) < $value){
                return false;
            }

        }

        return true;

	}

	public function getLevel($workspaceId, $userId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $currentUserId == $userId
            || $this->can($workspaceId, $currentUserId, "")
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
            $level = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel")->findOneBy(Array("workspace"=>$workspace->getId(),"id"=>$link->getLevel()));

			return $level;

		}

		return null; //Cant look this info
	}

	public function updateLevel($workspaceId, $levelId, $label, $rights, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->can($workspaceId, $currentUserId, "workspace:write")
		){

			$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");

			$level = $levelRepository->findBy(Array("workspace"=>$workspaceId,"level"=>$levelId));
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

            $datatopush = Array(
                "type" => "CHANGE_LEVEL",
                "data" => Array(
                    "workspaceId" => $workspaceId,
                )
            );
            $this->pusher->push($datatopush, "group/" . $workspaceId);

			return true;

		}

		return false;
	}

	public function getDefaultLevel($workspaceId)
	{
		$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
		$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

		$workspace = $workspaceRepository->find($workspaceId);
        $levels = $levelRepository->findBy(Array("workspace" => $workspace));
        foreach($levels as $level){
            if($level->getisDefault()){
                return $level;
            }
        }

        return false;

	}

	public function setDefaultLevel($workspaceId, $levelId, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->can($workspaceId, $currentUserId, "workspace:write")
		){

			$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

			$workspace = $workspaceRepository->find($workspaceId);

			$oldLevelDefault = $levelRepository->findOneBy(Array("workspace"=>$workspace, "isdefault"=>true));

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

			$level = $levelRepository->findBy(Array("workspace"=>$workspaceId,"level"=>$levelId));
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
			$levelDefault = $levelRepository->findOneBy(Array("workspace"=>$workspace, "isdefault"=>true));

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

            $datatopush = Array(
                "type" => "CHANGE_LEVEL",
                "data" => Array(
                    "workspaceId" => $workspace->getId(),
                )
            );
            $this->pusher->push($datatopush, "group/" . $workspace->getId());

			return true;

		}

		return false;
	}

	public function getUsers($workspaceId, $levelId, $currentUserId = null)
	{
		if($currentUserId == null
            || $this->can($workspaceId, $currentUserId, "workspace:read")
		) {

			$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

			$level = $levelRepository->findBy(Array("workspace"=>$workspaceId,"level"=>$levelId));
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
			$levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

			$workspace = $workspaceRepository->find($workspaceId);

			if (!$workspace) {
				return false;
			}

			$levels = $levelRepository->findBy(Array("workspace" => $workspace));

			return $levels;
	}

	public function getByLabel($workspaceId,$label, $currentUserId = null){
        if($currentUserId == null
            || $this->can($workspaceId, $currentUserId, "workspace:read")
        ) {

            $levelRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceLevel");
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");

            $workspace = $workspaceRepository->find($workspaceId);

            if (!$workspace) {
                return false;
            }

            $levels = $levelRepository->getByLabel($label,$workspace);

            return $levels;
        }

        return false;
    }



	// @Depreciated
	public function hasRight($userId, $workspaceId, $rightAsked)
	{
        $userId = $this->convertToEntity($userId, "TwakeUsersBundle:User");
        $userId = $userId->getId();

        $workspaceId = $this->convertToEntity($workspaceId, "TwakeWorkspacesBundle:Workspace");
        $workspaceId = $workspaceId->getId();

		return $this->can($workspaceId, $userId, $rightAsked);
	}

	// @Depreciated
	public function errorsAccess($userId, $workspaceId, $right)
	{
        $userId = $this->convertToEntity($userId, "TwakeUsersBundle:User");
        $userId = $userId->getId();

        $workspaceId = $this->convertToEntity($workspaceId, "TwakeWorkspacesBundle:Workspace");
        $workspaceId = $workspaceId->getId();

		if($this->can($workspaceId, $userId, $right)){
			return [];
		}
		return ["notallowed"];
	}

}

?>