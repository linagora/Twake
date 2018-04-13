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

        if($group==null){
            return false;
        }

        if($currentUserId == null
            || $group->hasPrivileges(
                $group->getLevel($groupId, $currentUserId),
                "VIEW_APPS"
            )
        ){
            //Group apps
            $groupappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
            $groupapps = $groupappsRepository->findBy(Array("group" => $group));


            $apps = array();
            foreach ( $groupapps as $ga ){
                $apps[] = $ga;
            }

            return $apps;
        }

        return false;
	}

}