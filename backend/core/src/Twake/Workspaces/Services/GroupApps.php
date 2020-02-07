<?php

namespace Twake\Workspaces\Services;

use Twake\Workspaces\Model\GroupAppsInterface;

class GroupApps
{
    private $doctrine;
    private $gms;
    private $was;

    public function __construct($doctrine, $group_managers_service, $workspace_apps_service)
    {
        $this->doctrine = $doctrine;
        $this->gms = $group_managers_service;
        $this->was = $workspace_apps_service;
    }

    public function getApps($groupId, $currentUserId = null)
    {
        $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
        $group = $groupRepository->find($groupId);

        if ($group == null) {
            return false;
        }

        if ($currentUserId == null
            || $this->gms->hasPrivileges(
                $this->gms->getLevel($groupId, $currentUserId),
                "MANAGE_APPS"
            )
        ) {
            //Group apps
            $groupappsRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupApp");
            $groupapps = $groupappsRepository->findBy(Array("group" => $group));

            $applicationRepository = $this->doctrine->getRepository("Twake\Market:Application");

            $apps = array();
            foreach ($groupapps as $ga) {

                $app = $applicationRepository->findOneBy(Array("id" => $ga->getAppId()));

                if (!$app) {

                    $this->removeApplication($group->getId(), $ga->getAppId());

                } else {

                    $workspace_app = $ga->getAsArray();
                    $workspace_app["app"] = $app->getAsArray();

                    $apps[] = $workspace_app;

                }
            }

            return $apps;
        }

        return false;
    }

    public function removeApplication($groupId, $appid, $currentUserId = null)
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

            //Group apps
            $groupappsRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupApp");
            $groupapp = $groupappsRepository->findOneBy(Array("group" => $group, "app_id" => $application->getId()));

            if (!$groupapp) {
                return true;
            }

            $workspaceAppsRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceApp");
            $workspace_apps = $workspaceAppsRepository->findBy(Array("groupapp_id" => $groupapp->getId()));

            foreach ($workspace_apps as $workspace_app) {
                $this->was->disableApp($workspace_app->getWorkspace()->getId(), $application->getId());
            }

            return true;
        }

        return false;
    }

    public function setWorkspaceDefault($groupId, $appid, $boolean, $currentUserId = null)
    {
        $groupRepository = $this->doctrine->getRepository("Twake\Workspaces:Group");
        $group = $groupRepository->find($groupId);

        if ($group == null) {
            return false;
        }

        if ($currentUserId == null
            || $this->gms->hasPrivileges(
                $this->gms->getLevel($groupId, $currentUserId),
                "MANAGE_APPS"
            )
        ) {
            //Group apps
            $groupappsRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupApp");
            $groupapp = $groupappsRepository->findOneBy(Array("group" => $group, "app_id" => $appid));

            $groupapp->setWorkspaceDefault($boolean);
            $this->doctrine->persist($groupapp);
            $this->doctrine->flush();

            return true;
        }
        return false;
    }

    //OLD CODE ?

    public function useApp($groupId, $workspaceId, $userId, $appid)
    {
        $groupUserRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupUser");
        $groupuser = $groupUserRepository->findOneBy(Array("user" => $userId, "group" => $groupId));

        $groupAppRepository = $this->doctrine->getRepository("Twake\Workspaces:GroupApp");
        $groupApp = $groupAppRepository->findOneBy(Array("group" => $groupId, "app" => $appid));

        if ($groupuser == null || $groupApp == null || $groupId == null) {//if no user or app not in group app's list or private workspace
            return false;
        } else {

            $appUsed = $groupuser->getUsedAppsToday();
            if (in_array($appid . "", $appUsed)) {
                return true;
            } else {

                if ($workspaceId) {
                    $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
                    $workspaceUser = $workspaceUserRepository->findOneBy(Array("workspace" => $workspaceId, "user" => $userId));
                    $workspaceUser->setLastAccess();
                    $this->doctrine->persist($workspaceUser);
                }

                if (!$groupuser->getDidConnectToday()) {
                    $groupuser->setDidConnectToday(true);
                }

                $appUsed[] = $appid;
                $groupuser->setUsedAppsToday($appUsed);

                $this->doctrine->persist($groupuser);
                $this->doctrine->flush();
                return true;
            }
        }

        return false;
    }


}