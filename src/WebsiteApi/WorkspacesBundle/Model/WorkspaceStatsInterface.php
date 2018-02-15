<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service Workspaces
 */
interface WorkspaceStatsInterface
{

	public function create($workspace);

	public function sendMessage($workspace, $private=true);

}