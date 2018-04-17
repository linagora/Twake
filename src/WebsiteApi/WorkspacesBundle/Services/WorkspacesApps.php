<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\DiscussionBundle\Entity\Stream;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceApp;
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

    public function getApps($workspaceId, $currentUserId = null, $onlymessageModule = false)
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
                $appRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
                if ($onlymessageModule){
                    $apps = $appRepository->findBy(Array("default"=>true, "messageModule"=>true));
                }else{
                    $apps = $appRepository->findBy(Array("default"=>true));
                }
                return $apps;
            }

            //Group apps
            $workspaceappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
            $workspaceapps = $workspaceappsRepository->findBy(Array("workspace" => $workspace));

            $apps = array();
            foreach ( $workspaceapps as $wa ){
                $app = $wa->getGroupapp()->getApp();
                if ($onlymessageModule){
                    if($app->getMessageModule()) {
                        $apps[] = $app;
                    }
                }else{
                    $apps[] = $app;
                }
            }
            return $apps;
        }

        return false;

    }


    //Depreciated
	/*public function _getAllApps($workspaceId, $currentUserId = null)
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
	}*/

    public function enableApp($workspaceId, $applicationId, $currentUserId = null)
    {
        $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $workspace = $workspaceRepository->find($workspaceId);

        $appRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $app = $appRepository->find($applicationId);

        if($workspace==null || $app==null){
            return false;
        }

        if($currentUserId==null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:edit")) {

            if ($workspace->getUser() != null
                && ($workspace->getUser()->getId() == $currentUserId || $currentUserId == null)
            ) {
                //cant enable in Private ws apps
                return false;
            }

            //Search in  GroupApp if the targeted app exists
            $groupappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
            $groupapp = $groupappsRepository->findOneBy(Array("group" => $workspace->getGroup(),"app" => $app));

            if ($groupapp == null){
                //Unauthorized app
                return false;
            }

            //Search if the App is already enabled
            $workspaceappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
            $workspaceapp = $workspaceappsRepository->findOneBy(Array("workspace" => $workspace,"groupapp" => $groupapp));
            if($workspaceapp){
                return true;
            }


            $workspaceapp = new WorkspaceApp($workspace,$groupapp);
            $this->doctrine->persist($workspaceapp);
            $this->doctrine->flush();

            return true;
        }

        return false;
    }

    public function disableApp($workspaceId, $applicationId, $currentUserId = null)
    {
        $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $workspace = $workspaceRepository->find($workspaceId);

        $appRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $app = $appRepository->find($applicationId);

        if($workspace==null || $app==null){
            return false;
        }

        if($currentUserId==null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:edit")) {

            if ($workspace->getUser() != null
                && ($workspace->getUser()->getId() == $currentUserId || $currentUserId == null)
            ) {
                //cant disable in Private ws apps
               return false;
            }

            //Search WorkspaceApp targeting the app
            $groupappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
            $groupapp = $groupappsRepository->findOneBy(Array("group" => $workspace->getGroup(),"app" => $app));

            $workspaceappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
            $workspaceapp = $workspaceappsRepository->findOneBy(Array("workspace" => $workspace,"groupapp" => $groupapp));

            $this->doctrine->remove($workspaceapp);
            $this->doctrine->flush();

            return true;
        }

        return false;
    }


}