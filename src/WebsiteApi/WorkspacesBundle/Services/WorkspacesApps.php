<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\DiscussionBundle\Entity\Stream;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceLevel;
use WebsiteApi\WorkspacesBundle\Model\WorkspacesAppsInterface;
use WebsiteApi\WorkspacesBundle\Model\WorkspacesInterface;

class WorkspacesApps implements WorkspacesAppsInterface
{

	private $wls;
	private $gas;
	private $doctrine;

	public function __construct($doctrine, $workspaces_levels_service, $groups_apps_service)
	{
		$this->doctrine = $doctrine;
		$this->wls = $workspaces_levels_service;
		$this->gas = $groups_apps_service;
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