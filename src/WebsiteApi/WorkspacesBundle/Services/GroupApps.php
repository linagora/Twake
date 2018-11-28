<?php

namespace WebsiteApi\WorkspacesBundle\Services;

use WebsiteApi\WorkspacesBundle\Model\GroupAppsInterface;

class GroupApps implements GroupAppsInterface
{
    private $doctrine;
    private $gms;

    public function __construct($doctrine, $group_managers_service)
    {
        $this->doctrine = $doctrine;
        $this->gms = $group_managers_service;
    }

    public function getApps($groupId, $currentUserId = null)
    {
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
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
            $groupappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
            $groupapps = $groupappsRepository->findBy(Array("group" => $group));

            $apps = array();
            foreach ($groupapps as $ga) {
                $apps[] = $ga;
            }

            return $apps;
        }

        return false;
    }

    public function getAppsForPDF($groupId, $currentUserId = null)
    {
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
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
            $groupappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
            $groupapps = $groupappsRepository->findBy(Array("group" => $group));

            $apps = array();
            foreach ($groupapps as $ga) {
                $gaFormat["id"] = $ga->getId();
                $gaFormat["name"] = $ga->getName();
                $apps[] = $gaFormat;
            }

            return $apps;
        }

        return false;
    }

    public function setWorkspaceDefault($groupId, $appid, $boolean, $currentUserId = null)
    {
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
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
            $groupappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
            $groupapps = $groupappsRepository->findBy(Array("group" => $group));


            foreach ($groupapps as $ga) {
                if ($ga->getApp()->getId() == $appid) {
                    $ga->setWorkspaceDefault($boolean);
                    $this->doctrine->persist($ga);
                }
            }

            $this->doctrine->flush();
            return true;
        }
        return false;
    }

    public function removeApplication($groupId, $appid, $currentUserId = null)
    {
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->find($groupId);

        $applicationRepository = $this->doctrine->getRepository("TwakeMarketBundle:Application");
        $application = $applicationRepository->find($appid);

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
            $groupappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
            $groupapps = $groupappsRepository->findBy(Array("group" => $group, "app" => $application));

            //Workspace apps
            $workspaceappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
            $workspaceapps = $workspaceappsRepository->findBy(Array("groupapp" => $groupapps));

            foreach ($workspaceapps as $wa) {
                $this->doctrine->remove($wa);
            }

            foreach ($groupapps as $ga) {
                $this->doctrine->remove($ga);
            }
            $application->decreaseInstall();
            $this->doctrine->persist($application);
            $this->doctrine->flush();
            return true;
        }
        return false;
    }

    public function useApp($groupId, $workspaceId, $userId, $appid)
    {
        $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser");
        $groupuser = $groupUserRepository->findOneBy(Array("user_group_id" => $userId . "_" . $groupId));

        $groupAppRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
        $groupApp = $groupAppRepository->findOneBy(Array("group" => $groupId, "app" => $appid));

        if ($groupuser == null || $groupApp == null || $groupId == null) {//if no user or app not in group app's list or private workspace
            return false;
        }else{

            $appUsed = $groupuser->getUsedAppsToday();
            if (in_array($appid, $appUsed)) {
                return true;
            }else{

                if ($workspaceId) {
                    $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");
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