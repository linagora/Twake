<?php

namespace Tests\WebsiteApi\Controller;

use Tests\WebTestCaseExtended;

class GroupMembersInviteTest extends WebTestCaseExtended
{


	/*
	 * Pour $usernameMember (celui qui invite un membre)
	 * - "GroupMember" : le créateur du groupe
	 * - "GroupMemberSimple" : deuxième membre, invité si $memberInvited et accepté si $memberAccepted
	 * */
public function checkError($inviteEmail, $errorLabel, $usernameMember, $memberInvited, $memberAccepted, $correctGroupId = true, $wrongInvitedUser = false) {

		// Création des entités nécessaires
		$this->createUser("GroupMember", "email1@test.com", "Password0");
		$this->createUser("InvitedMember", "email2@test.com", "Password0");
		$this->createUser("GroupMemberSimple", "email3@test.com", "Password0");

		$this->login("GroupMember", "Password0");
		$groupId = $this->createGroup()["gid"];

		if ($memberInvited) {

			$this->inviteUserInGroup($groupId, "GroupMemberSimple");

			if ($memberAccepted) {
				$this->login("GroupMemberSimple", "Password0");
				$this->acceptGroupInvitation($groupId);
			}
		}

		// Invitation
		if ($usernameMember != "") {
			$this->login($usernameMember, "Password0");
		}
		else {
			$this->logout();
		}

		if (!$inviteEmail)
			$resInvitation = $this->inviteUserInGroup($correctGroupId ? $groupId : 0, $wrongInvitedUser ? "" : "InvitedMember");
		else
			$resInvitation = $this->inviteUserInGroup($correctGroupId ? $groupId : 0, "test@email.com");

		// Tests
		$this->assertNotEquals(null, $resInvitation, "Test " . $errorLabel . "  (mail : " . $inviteEmail . ") : erreur 500");
		$this->assertEquals(1, count($resInvitation["errors"]), "Test " . $errorLabel . "  (mail : " . $inviteEmail . ") : mauvais nombre d'erreurs retournées");
		$this->assertEquals($errorLabel, $resInvitation["errors"][0], "Test " . $errorLabel . "  (mail : " . $inviteEmail . ") : mauvaise erreur retournée");

		$memberCount = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Workspace")->findOneById($groupId)->getMemberCount();
		$this->assertEquals($memberInvited && $memberAccepted ? 2 : 1, $memberCount, "Test " . $errorLabel . "  (mail : " . $inviteEmail . ") : nombre de membres du groupe mauvais");

		// Suppression des entités
		$this->removeGroup($groupId);
		$this->deleteUser("email1@test.com");
		$this->deleteUser("email2@test.com");
		$this->deleteUser("email3@test.com");
	}

	public function checkCorrect($inviteEmail) {

		// Création des entités nécessaires
		$this->createUser("GroupMember", "email1@test.com", "Password0");
		$this->createUser("InvitedMember", "email2@test.com", "Password0");

		$this->login("GroupMember", "Password0");
		$groupId = $this->createGroup()["gid"];

		// Invitation
		$resInvitation = $this->inviteUserInGroup($groupId, $inviteEmail ? "test@email.com" : "InvitedMember");

		// Tests
		$this->assertNotEquals(null, $resInvitation, "Test correct  (mail : " . $inviteEmail . ") : erreur 500" . $this->getClient()->getResponse()->getContent());
		$this->assertEquals(0, count($resInvitation["errors"]), "Test correct  (mail : " . $inviteEmail . ") : mauvais nombre d'erreurs retournées");

		// Tests sur la base de données
		if ($inviteEmail) {
			$userGroupLink = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("Workspace" => $groupId, "mail" => "test@email.com"));
		}
		else {
			$this->login("InvitedMember", "Password0");
			$userId = $this->api("/ajax/users/current/get", Array())["data"]["uid"];
			$userGroupLink = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("Workspace" => $groupId, "User" => $userId));
		}

		$this->assertNotEquals(null, $userGroupLink, "Test correct (mail : " . $inviteEmail . ") : membre non ajouté au groupe");
		$this->assertEquals($inviteEmail ? "W" : "P", $userGroupLink->getStatus(), "Test correct  (mail : " . $inviteEmail . ") : membre non ajouté au groupe");

		$memberCount = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Workspace")->findOneById($groupId)->getMemberCount();
		$this->assertEquals(1, $memberCount, "Test correct (mail : " . $inviteEmail . ") : nombre de membres du groupe mauvais");

		// Suppression des entités
		$this->removeGroup($groupId);
		$this->deleteUser("email1@test.com");
		$this->deleteUser("email2@test.com");
	}

	public function testNotConnected() {

		$this->checkError(true, "notallowed", "", false, false);
		$this->checkError(false, "notallowed", "", false, false);
	}

	public function testNotAllowedNotMember() {

		$this->checkError(true, "notallowed", "GroupMemberSimple", false, false);
		$this->checkError(false, "notallowed", "GroupMemberSimple", false, false);
	}

	public function testNotAllowedNotAccepted()
	{
		$this->checkError(true, "notallowed", "GroupMemberSimple", true, false);
		$this->checkError(false, "notallowed", "GroupMemberSimple", true, false);
	}

	public function testNotAllowedHaveNotRight()
	{
		$this->checkError(true, "notallowed", "GroupMemberSimple", true, true);
		$this->checkError(false, "notallowed", "GroupMemberSimple", true, true);
	}

	public function testNoSuchGroup()
	{
		$this->checkError(true, "nosuchgroup", "GroupMember", false, false, false);
		$this->checkError(false, "nosuchgroup", "GroupMember", false, false, false);
	}

	public function testUserNotFound()
	{
		$this->checkError(false, "unknown", "GroupMember", false, false, true, true);
	}
	
	public function testCorrect()
	{
		$this->checkCorrect(true);
		$this->checkCorrect(false);
	}
}
