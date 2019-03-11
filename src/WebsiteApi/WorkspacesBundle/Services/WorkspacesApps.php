<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\DiscussionBundle\Entity\Channel;
use WebsiteApi\WorkspacesBundle\Entity\GroupApp;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceApp;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceLevel;
use WebsiteApi\WorkspacesBundle\Model\WorkspacesAppsInterface;
use WebsiteApi\WorkspacesBundle\Model\WorkspacesInterface;

class WorkspacesApps implements WorkspacesAppsInterface
{

	private $wls;
	private $doctrine;
    private $gms;
    private $pusher;


    public function __construct($doctrine, $workspaces_levels_service, $group_managers_service, $pusher)
	{
		$this->doctrine = $doctrine;
		$this->wls = $workspaces_levels_service;
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

            //Group apps
            $workspaceappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
            $workspaceapps = $workspaceappsRepository->findBy(Array("workspace" => $workspace));

            $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
            $groupappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");

            $apps = array();
            foreach ( $workspaceapps as $wa ){

                $app = $applicationRepository->findOneBy(Array("id" => $wa->getAppId()));

                if (!$app) {

                    $this->disableApp($workspace->getId(), $wa->getAppId());

                } else {


                    $groupapp = $groupappsRepository->findOneBy(Array("group" => $workspace->getGroup(), "app_id" => $app->getId()));

                    $workspace_app = $groupapp->getAsArray();
                    $workspace_app["workspace_id"] = $workspace->getId();
                    $workspace_app["app"] = $app->getAsArray();

                    $apps[] = $workspace_app;

                }
            }
            return $apps;
        }

        return false;

    }

    public function forceApplication($groupId, $appid, $currentUserId = null)
    {
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->find($groupId);

        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $application = $applicationRepository->findOneBy(Array("id" => $appid));

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

                $this->enableApp($workspace->getId(), $appid, null);

            }

            return true;
        }
        return false;
    }

    public function enableApp($workspaceId, $applicationId, $currentUserId = null)
    {
        $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $workspace = $workspaceRepository->findOneBy(Array("id" => $workspaceId));

        $appRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $app = $appRepository->findOneBy(Array("id" => $applicationId));

        if($workspace==null || $app==null){
            return false;
        }

        if($currentUserId==null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")) {

            //Search in  GroupApp if the targeted app exists
            $groupappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
            $groupapp = $groupappsRepository->findOneBy(Array("group" => $workspace->getGroup(), "app_id" => $app->getId()));

            if ($groupapp == null){
                $groupapp = new GroupApp($workspace->getGroup(), $app->getId());
                $this->doctrine->persist($groupapp);
            }

            $groupapp->setPrivilegesCapabilitiesLastRead(new \DateTime());
            $groupapp->setCapabilities($app->getCapabilities());
            $groupapp->setPrivileges($app->getPrivileges());

            //Search if the App is already enabled
            $workspaceappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
            $workspaceapp = $workspaceappsRepository->findOneBy(Array("workspace" => $workspace, "groupapp_id" => $groupapp->getId()));

            if($workspaceapp){
                $this->doctrine->persist($groupapp);
                $this->doctrine->flush();
                return true;
            }

            $groupapp->setWorkspacesCount($groupapp->getWorkspacesCount() + 1);
            $this->doctrine->persist($groupapp);

            $app->setInstallCount($app->getInstallCount() + 1);
            $this->doctrine->persist($app);

            $workspaceapp = new WorkspaceApp($workspace, $groupapp->getId(), $groupapp->getAppId());
            $this->doctrine->persist($workspaceapp);
            $this->doctrine->flush();

            $workspace_app = $groupapp->getAsArray();
            $workspace_app["workspace_id"] = $workspace->getId();
            $workspace_app["app"] = $app->getAsArray();

            $datatopush = Array(
                "type" => "add",
                "workspace_app" => $workspace_app
            );
            $this->pusher->push($datatopush, "workspace_apps/" . $workspace->getId());

            return true;
        }

        return false;
    }

    public function disableApp($workspaceId, $applicationId, $currentUserId = null)
    {
        $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $workspace = $workspaceRepository->findOneBy(Array("id" => $workspaceId));

        $appRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $app = $appRepository->findOneBy(Array("id" => $applicationId));

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
            $groupapp = $groupappsRepository->findOneBy(Array("group" => $workspace->getGroup(), "app_id" => $app->getId()));


            $groupapp->setWorkspacesCount($groupapp->getWorkspacesCount() - 1);

            $app->setInstallCount($app->getInstallCount() - 1);
            $this->doctrine->persist($app);

            $workspaceappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
            $workspaceapp = $workspaceappsRepository->findOneBy(Array("workspace" => $workspace, "groupapp_id" => $groupapp->getId()));

            if ($groupapp->getWorkspacesCount() <= 0) {
                $this->doctrine->remove($groupapp);
            }

            $this->doctrine->remove($workspaceapp);
            $this->doctrine->flush();

            $workspace_app = $groupapp->getAsArray();
            $workspace_app["workspace_id"] = $workspace->getId();
            $workspace_app["app"] = $app->getAsArray();

            $datatopush = Array(
                "type" => "remove",
                "workspace_app" => $workspace_app
            );
            $this->pusher->push($datatopush, "workspace_apps/" . $workspace->getId());

            return true;
        }

        return false;
    }


}