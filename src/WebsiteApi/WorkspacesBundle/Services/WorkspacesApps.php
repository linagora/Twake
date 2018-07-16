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
    private $gms;
    private $pusher;


    public function __construct($doctrine, $workspaces_levels_service, $groups_apps_service, $group_managers_service, $pusher)
	{
		$this->doctrine = $doctrine;
		$this->wls = $workspaces_levels_service;
		$this->gas = $groups_apps_service;
        $this->gms = $group_managers_service;
        $this->pusher = $pusher;

    }

    public function getApps($workspaceId, $currentUserId = null, $onlymessageModule = false , $onlyEditableRights = false)
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
                if ($onlyEditableRights){
                    $apps = $appRepository->findBy(Array("default"=>true, "editableRights"=>true));
                }elseif ($onlymessageModule){
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
                if ($onlyEditableRights){
                    if ($app->getEditableRights()){
                        $apps[] = $app;
                    }
                }elseif ($onlymessageModule){
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

    public function forceApplication($groupId, $appId, $currentUserId = null)
    {
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->find($groupId);

        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $application = $applicationRepository->find($appId);

        if ($group == null || $application == null) {
            return false;
        }

        if ($currentUserId == null
            || $this->gms->hasPrivileges(
                $this->gms->getLevel($groupId, $currentUserId),
                "MANAGE_APPS"
            )
        ) {
            $workspaces = $group->getWorkspaces();
            foreach ($workspaces as $workspace){

                $this->enableApp($workspace->getId(),$appId,$currentUserId);

                $datatopush = Array(
                    "type" => "CHANGE_WORKSPACE_APPS",
                    "data" => Array(
                        "workspaceId" => $workspace->getId(),
                    )
                );
                $this->pusher->push($datatopush, "group/" . $workspace->getId());

            }

            return true;
        }
        return false;
    }

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
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")) {

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

            $datatopush = Array(
                "type" => "CHANGE_WORKSPACE_APPS",
                "data" => Array(
                    "workspaceId" => $workspace->getId(),
                )
            );
            $this->pusher->push($datatopush, "group/" . $workspace->getId());

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
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")) {

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

            $datatopush = Array(
                "type" => "CHANGE_WORKSPACE_APPS",
                "data" => Array(
                    "workspaceId" => $workspace->getId(),
                )
            );
            $this->pusher->push($datatopush, "group/" . $workspace->getId());

            return true;
        }

        return false;
    }


}