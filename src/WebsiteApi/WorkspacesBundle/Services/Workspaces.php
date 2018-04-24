<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\DiscussionBundle\Entity\Stream;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceApp;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceLevel;
use WebsiteApi\WorkspacesBundle\Model\WorkspacesInterface;

class Workspaces implements WorkspacesInterface
{

	private $wls;
	private $wms;
	private $gms;
	private $gas;
	private $ws;
	private $doctrine;
	private $pricing;

	public function __construct($doctrine, $workspaces_levels_service, $workspaces_members_service, $groups_managers_service, $groups_apps_service, $workspace_stats,$priceService)
	{
		$this->doctrine = $doctrine;
		$this->wls = $workspaces_levels_service;
		$this->wms = $workspaces_members_service;
		$this->gms = $groups_managers_service;
		$this->gas = $groups_apps_service;
		$this->ws = $workspace_stats;
		$this->pricing = $priceService;
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

		if($name==""){
			return false;
		}

		$workspace = new Workspace($name);

		if($groupId!=null){
			$groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
			$group = $groupRepository->find($groupId);

            $limit = $this->pricing->getLimitation($groupId,"maxWorkspace",PHP_INT_MAX);
            $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
            $nbWorkspace = $workspaceRepository->findBy(Array("group"=>$group,"isDeleted"=>0));

            if(count($nbWorkspace) >= $limit){
                return false;
            }
			$workspace->setGroup($group);
		}

        $this->doctrine->persist($workspace);
		$this->doctrine->flush();

		// Create stream
        $streamGeneral = new Stream($workspace,"General",false,"This is the general stream");
		$streamGeneral->setType("stream");
        $streamRandom = new Stream($workspace,"Random",false,"This is the random stream");
		$streamRandom->setType("stream");

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

		$this->ws->create($workspace); //Create workspace stat element

        //init default apps
        $this->init($workspace);

		return $workspace;

	}

	public function remove($groupId, $workspaceId, $currentUserId = null)
	{
		if($currentUserId == null
			|| ($this->wls->can($workspaceId, $currentUserId, "workspace:write")
				&& count($this->wms->getMembers($workspaceId))<=1
			)
			|| $this->gms->hasPrivileges($this->gms->getLevel($groupId, $currentUserId), "MANAGE_WORKSPACES")
		){
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspace = $workspaceRepository->find($workspaceId);

			$this->wms->removeAllMember($workspaceId);

			$workspace->setIsDeleted(true);

			$this->doctrine->persist($workspace);
			$this->doctrine->flush();

			return true;
		}
		return false;
	}

	public function changeName($workspaceId, $name, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "workspace:write")
		){

			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspace = $workspaceRepository->find($workspaceId);

			$workspace->setName($name);

			$this->doctrine->persist($workspace);
			$this->doctrine->flush();


			return true;
		}

		return false;
	}

	public function changeLogo($workspaceId, $logo, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "workspace:write")
		){

			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspace = $workspaceRepository->find($workspaceId);

			if($workspace->getLogo()) {
				$workspace->getLogo()->deleteFromDisk();
				$this->doctrine->remove($workspace->getLogo());
			}
			$workspace->setLogo($logo);

			$this->doctrine->persist($workspace);
			$this->doctrine->flush();

			return true;
		}

		return false;
	}

	public function changeWallpaper($workspaceId, $wallpaper, $currentUserId = null)
	{
		if($currentUserId == null
			|| $this->wls->can($workspaceId, $currentUserId, "workspace:write")
		){

			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspace = $workspaceRepository->find($workspaceId);

			if($workspace->getWallpaper()) {
				$workspace->getWallpaper()->deleteFromDisk();
				$this->doctrine->remove($workspace->getWallpaper());
			}
			$workspace->setWallpaper($wallpaper);

			$this->doctrine->persist($workspace);
			$this->doctrine->flush();

			return true;
		}

		return false;
	}

	public function get($workspaceId, $currentUserId = null)
	{

		if($currentUserId==null
		  || $this->wls->can($workspaceId, $currentUserId, "")){
			$workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
			$workspace = $workspaceRepository->find($workspaceId);

			$this->ws->create($workspace); //Create workspace stat element

			return $workspace;
		}

		return false;
	}

    public function init(Workspace $workspace){
        $groupappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
        $grouppaceapps = $groupappsRepository->findBy(Array("group" => $workspace->getGroup()));

        $workspaceappRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
        $workspaceapps = $workspaceappRepository->findBy(Array("workspace" => $workspace));

        if(count($grouppaceapps) != 0 && count($workspaceapps) == 0 ) {

            foreach ( $grouppaceapps as $ga ){
                if ($ga->getWorkspaceDefault()){
                    $workspaceapp = new WorkspaceApp($workspace,$ga);
                    $this->doctrine->persist($workspaceapp);
                }
            }

            $this->doctrine->flush();
        }

        if($workspace->getMemberCount()==0) {

            $members = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findBy(Array("workspace" => $workspace));
            $workspace->setMemberCount(count($members));
            $this->doctrine->persist($workspace);

            $this->doctrine->flush();
        }

        //Déjà initialisé
        return false;
    }

}