<?php

namespace Twake\Workspaces\Services;

use Twake\Discussion\Entity\Channel;
use Twake\Workspaces\Entity\GroupApp;
use Twake\Workspaces\Entity\WorkspaceApp;
use Twake\Workspaces\Model\WorkspacesAppsInterface;
use Twake\Workspaces\Model\WorkspacesInterface;
use App\App;

class WorkspacesApps
{

    private $wls;
    private $doctrine;
    private $gms;
    private $pusher;
    private $channel_system;
    private $application_api;

    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->wls = $app->getServices()->get("app.workspace_levels");
        $this->gms = $app->getServices()->get("app.group_managers");
        $this->pusher = $app->getServices()->get("app.pusher");
        $this->channel_system = $app->getServices()->get("app.channels.channels_system");
        $this->application_api = $app->getServices()->get("app.applications_api");
    }

    public function getApps($workspaceId, $currentUserId = null, $onlymessageModule = false, $onlyEditableRights = false)
    {

        $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
        $workspace = $workspaceRepository->findOneBy(["id"=>$workspaceId]);

        if ($workspace == null) {
            return false;
        }

        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "")) {

            //Group apps
            $workspaceappsRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceApp");
            $workspaceapps = $workspaceappsRepository->findBy(Array("workspace" => $workspace));

            $applicationRepository = $this->doctrine->getRepository("Twake\Market:Application");
            $groupappsRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupApp");

            $apps = array();
            foreach ($workspaceapps as $wa) {

                $app = $applicationRepository->findOneBy(Array("id" => $wa->getAppId()));

                if (!$app) {

                    $this->disableApp($workspace->getId(), $wa->getAppId());

                } else {


                    $groupapp = $groupappsRepository->findOneBy(Array("group" => $workspace->getGroup(), "app_id" => $app->getId()));

                    if($groupapp){

                        $workspace_app = $groupapp->getAsArray();
                        $workspace_app["workspace_id"] = $workspace->getId();
                        $workspace_app["app"] = $app->getAsArray();

                        $apps[] = $workspace_app;

                    }

                }
            }
            return $apps;
        }

        return false;

    }

    public function disableApp($workspaceId, $applicationId, $currentUserId = null)
    {
        $current_user_id = $currentUserId;

        $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
        $workspace = $workspaceRepository->findOneBy(Array("id" => $workspaceId));

        $appRepository = $this->doctrine->getRepository("Twake\Market:Application");
        $app = $appRepository->findOneBy(Array("id" => $applicationId));

        if ($workspace == null || $app == null) {
            return false;
        }

        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")) {

            //Search WorkspaceApp targeting the app
            $groupappsRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupApp");
            $groupapp = $groupappsRepository->findOneBy(Array("group" => $workspace->getGroup(), "app_id" => $app->getId()));


            $groupapp->setWorkspacesCount($groupapp->getWorkspacesCount() - 1);

            $app->setInstallCount($app->getInstallCount() - 1);
            $this->doctrine->persist($app);

            $workspaceappsRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceApp");
            $workspaceapp = $workspaceappsRepository->findOneBy(Array("workspace" => $workspace, "groupapp_id" => $groupapp->getId()));

            if ($groupapp->getWorkspacesCount() <= 0) {
                $this->doctrine->remove($groupapp);
            }

            $this->doctrine->remove($workspaceapp);
            $this->doctrine->flush();

            //Remove resource access to workspace
            $this->application_api->removeResource($app->getId(), $workspace->getId(), "workspace", $workspace->getId(), $current_user_id);

            $workspace_app = $groupapp->getAsArray();
            $workspace_app["workspace_id"] = $workspace->getId();
            $workspace_app["app"] = $app->getAsArray();

            $datatopush = Array(
                "type" => "remove",
                "workspace_app" => $workspace_app
            );
            $this->pusher->push($datatopush, "workspace_apps/" . $workspace->getId());

            $this->channel_system->removeApplicationChannel($app, $workspace);

            return true;
        }

        return false;
    }

    public function forceApplication($groupId, $appid, $currentUserId = null)
    {
        $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
        $group = $groupRepository->find($groupId);

        $applicationRepository = $this->doctrine->getRepository("Twake\Market:Application");
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
            foreach ($workspaces as $workspace) {

                $this->enableApp($workspace->getId(), $appid, null);

            }

            return true;
        }
        return false;
    }

    public function enableApp($workspaceId, $applicationId, $currentUserId = null)
    {
        $current_user_id = $currentUserId;

        $workspaceRepository = $this->doctrine->getRepository("Twake\Workspaces:Workspace");
        $workspace = $workspaceRepository->findOneBy(Array("id" => $workspaceId));

        $appRepository = $this->doctrine->getRepository("Twake\Market:Application");
        $app = $appRepository->findOneBy(Array("id" => $applicationId));

        if ($workspace == null || $app == null) {
            error_log("hello 2");
            error_log($applicationId);
            return false;
        }

        if ($currentUserId == null
            || $this->wls->can($workspaceId, $currentUserId, "workspace:write")) {

            //Search in  GroupApp if the targeted app exists
            $groupappsRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupApp");
            $groupapp = $groupappsRepository->findOneBy(Array("group" => $workspace->getGroup(), "app_id" => $app->getId()));

            if ($groupapp == null) {
                $groupapp = new GroupApp($workspace->getGroup(), $app->getId());
                $this->doctrine->persist($groupapp);
            }

            $groupapp->setPrivilegesCapabilitiesLastRead(new \DateTime());
            $groupapp->setCapabilities($app->getCapabilities());
            $groupapp->setPrivileges($app->getPrivileges());
            $groupapp->setHooks($app->getHooks());

            //Search if the App is already enabled
            $workspaceappsRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceApp");
            $workspaceapp = $workspaceappsRepository->findOneBy(Array("workspace" => $workspace, "groupapp_id" => $groupapp->getId()));

            if ($workspaceapp) {
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

            //Add resource access to workspace if workspace privilege is requested
            if (in_array("workspace", $app->getPrivileges())) {
                $this->application_api->addResource($app->getId(), $workspace->getId(), "workspace", $workspace->getId(), $current_user_id);
            }
            if (in_array("workspace_calendar", $app->getPrivileges())) {
                $this->application_api->addResource($app->getId(), $workspace->getId(), "workspace_calendar", $workspace->getId(), $current_user_id);
            }
            if (in_array("workspace_drive", $app->getPrivileges())) {
                $this->application_api->addResource($app->getId(), $workspace->getId(), "workspace_drive", $workspace->getId(), $current_user_id);
            }

            $workspace_app = $groupapp->getAsArray();
            $workspace_app["workspace_id"] = $workspace->getId();
            $workspace_app["app"] = $app->getAsArray();

            $datatopush = Array(
                "type" => "add",
                "workspace_app" => $workspace_app
            );
            $this->pusher->push($datatopush, "workspace_apps/" . $workspace->getId());

            $this->channel_system->getApplicationChannel($app, $workspace);

            return true;
        }

        return false;
    }


}