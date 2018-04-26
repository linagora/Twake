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
                "VIEW_APPS"
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

    public function setWorkspaceDefault($groupId, $appId, $boolean, $currentUserId = null)
    {
        $groupRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $group = $groupRepository->find($groupId);

        if ($group == null) {
            return false;
        }

        if ($currentUserId == null
            || $this->gms->hasPrivileges(
                $this->gms->getLevel($groupId, $currentUserId),
                "VIEW_APPS"
            )
        ) {
            //Group apps
            $groupappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
            $groupapps = $groupappsRepository->findBy(Array("group" => $group));


            foreach ($groupapps as $ga) {
                if ($ga->getApp()->getId() == $appId) {
                    $ga->setWorkspaceDefault($boolean);
                    $this->doctrine->persist($ga);
                }
            }

            $this->doctrine->flush();
            return true;
        }
        return false;
    }

    public function removeApplication($groupId, $appId, $currentUserId = null)
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
                "VIEW_APPS"
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

    public function appUsed($groupId, $userId, $appId)
    {
        $groupUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $groupUser = $groupUserRepository->findBy(Array("group_id" => $groupId , "user_id" => $userId));

        if ($groupUser == null) {
            var_dump("J'AI PERDU MON PARI LOL");
            return false;
        }else{

            $appUsed = $groupUser->getApps();
            if ( in_array($appId,$appUsed) ){
                return true;
            }else{

                if (!$groupUser->getConnectedToday()){
                    $groupUser->setConnectedToday(true);
                }
                $appUsed[] = $appId;
                $groupUser->setApps($appUsed);

                $this->doctrine->persist($groupUser);
                $this->doctrine->flush();
                return true;
            }
        }

        return false;
    }


}