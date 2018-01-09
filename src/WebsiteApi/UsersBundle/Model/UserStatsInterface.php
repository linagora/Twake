<?php

namespace WebsiteApi\UsersBundle\Model;

/**
 * This is an interface for the service UserStats
 *
 * This service is responsible for recording data from user for statistical purpose only
 */
interface UserStatsInterface
{

	// @login when an user log in
	public function login($userId);

	// @sendMessage when an user send a message
	public function sendMessage($userId);

	// @addFile when an user add a file
	public function addFile($userId, $size);

	// @downloadFile when an user download a file
	public function downloadFile($userId);

	// @openApp when an user open an app
	public function openApp($userId, $appId);

	// @openWorkspace when an user open a workspace
	public function openWorkspace($userId, $workspaceId);

}