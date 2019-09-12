<?php

namespace WebsiteApi\WorkspacesBundle\Model;

/**
 * This is an interface for the service WorkspaceMembers
 *
 * This service manage members of a workspace
 */
interface WorkspaceMembersInterface
{

	// @changeLevel change user level in workspace
	public function changeLevel($workspaceId, $userId, $levelId, $currentUserId=null);

	// @addMember add user in workspace as member
    public function addMember($workspaceId, $userId, $asExterne = false, $levelId = null, $currentUserId = null);

	// @removeMember remove member from workspace
	public function removeMember($workspaceId, $userId, $currentUserId=null);

	// @removeAllMember remove all members from workspace
	public function removeAllMember($workspaceId);

	//@addMemberByUsername add an user by username
	public function addMemberByUsername($workspaceId, $username,$asExterne,$autoAddExterne, $currentUserId = null);

	//@addMemberByMail add an user by e-mail
	public function addMemberByMail($workspaceId, $mail,$asExterne,$autoAddExterne, $currentUserId = null);

	//@removeMemberByMail remove an user by e-mail
	public function removeMemberByMail($workspaceId, $mail, $currentUserId = null);

	//@autoAddMemberByNewMail add member invited by mail
	public function autoAddMemberByNewMail($mail, $userId);

	// @getMembers returns members for workspace ([{user: OBJECT, level: OBJECT}])
	public function getMembers($workspaceId, $currentUserId=null);

	// @getPendingMembers returns mails-members for workspace
	public function getPendingMembers($workspaceId, $currentUserId=null);

	// @getWorkspaces returns workspaces of an user
	public function getWorkspaces($userId);

}