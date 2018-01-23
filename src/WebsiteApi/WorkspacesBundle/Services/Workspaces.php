<?php

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\WorkspacesBundle\Model\WorkspacesInterface;

class Workspaces implements WorkspacesInterface
{

	public function getPrivate($currentUser = null)
	{
		// TODO: Implement getPrivate() method.
	}

	public function create($groupId, $name, $currentUser = null)
	{
		// TODO: Implement create() method.
	}

	public function remove($groupId, $workspaceId, $currentUser = null)
	{
		// TODO: Implement remove() method.
	}

	public function changeData($name, $thumbnailFile, $currentUser = null)
	{
		// TODO: Implement changeData() method.
	}
}