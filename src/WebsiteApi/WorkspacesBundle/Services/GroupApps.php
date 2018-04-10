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
		//Todo
		$appRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupApp");
		return $appRepository->findBy(Array());
	}

}