<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\WorkspacesBundle\Model\WorkspacesInterface;

class Workspaces implements WorkspacesInterface
{

	public function __construct($doctrine)
	{
		$this->doctrine = $doctrine;
	}

	public function getPrivate($currentUserId = null)
	{
		// TODO: Implement getPrivate() method.
	}

	public function create($groupId, $name, $currentUserId = null)
	{
		// TODO: Implement create() method.
	}

	public function remove($groupId, $workspaceId, $currentUserId = null)
	{
		// TODO: Implement remove() method.
	}

	public function changeData($name, $thumbnailFile, $currentUserId = null)
	{
		// TODO: Implement changeData() method.
	}
}