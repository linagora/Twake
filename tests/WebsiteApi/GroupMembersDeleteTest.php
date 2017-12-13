<?php

namespace Tests\WebsiteApi\Controller;

use Tests\WebTestCaseExtended;

class GroupMembersDeleteTest extends WebTestCaseExtended
{
	var $groupId = 0;

	public function checkError($email, $errorLabel, $connected, $wrongGroupId, $isInGroup, $haveRight, $lastOwner, $userFound) {

		// Création des entités nécessaires
		$this->createUser("GroupMember", "email1@test.com", "Password0");
		$this->createUser("InvitedMember", "email2@test.com", "Password0");
		$this->createUser("OtherMember", "email3@test.com", "Password0");

		$this->login("GroupMember", "Password0");
		$this->groupId = $this->createGroup()["gid"];

		$resGroupUserId = $this->api("/ajax/users/get", Array("username" => "GroupMember"))['data']['idUser'];
		$resInvitedUserId = $this->api("/ajax/users/get", Array("username" => "InvitedMember"))['data']['idUser'];
		$this->login("GroupMember", "Password0");

		if (!$email) {
			$this->deleteMemberFromGroup($this->groupId, Array(), Array(!$userFound ? 0 : ($lastOwner ? $resGroupUserId : $resInvitedUserId)));
			$this->inviteUserInGroup($this->groupId, !$userFound ? "" : ($lastOwner ? "GroupMember" : "InvitedMember"));
		}
		else {
			$this->deleteMemberFromGroup($this->groupId, Array(!$userFound ? "" : "test@email.com"), Array());
			$this->inviteUserInGroup($this->groupId, !$userFound ? "" : "test@email.com");
		}

		// Connection
		if (!$connected) {
			$this->logout();
		}
		else {
			if ($isInGroup) {
				$this->login($haveRight ? "GroupMember" : "InvitedMember", "Password0");
			}
			else {
				$this->login("OtherMember", "Password0");
			}
		}

		// Suppression
		if (!$email) {
			$resDeletion = $this->deleteMemberFromGroup($wrongGroupId ? 0 : $this->groupId, Array(), Array(!$userFound ? 0 : ($lastOwner ? $resGroupUserId : $resInvitedUserId)));
		}
		else {
			$resDeletion = $this->deleteMemberFromGroup($wrongGroupId ? 0 : $this->groupId, Array(!$userFound ? "" : "test@email.com"), Array());
		}

		// Tests
		$this->assertNotEquals(null, $resDeletion, "Test " . $errorLabel . "  (mail : " . $email . ") : erreur 500");
		$this->assertEquals(1, count($resDeletion["errors"]), "Test " . $errorLabel . "  (mail : " . $email . ") : mauvais nombre d'erreurs retournées");
		$this->assertEquals($errorLabel, $resDeletion["errors"][0], "Test " . $errorLabel . "  (mail : " . $email . ") : mauvaise erreur retournée");

		$repoWorkspaceUser = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser");
		if ($userFound) {
			if (!$email) {
				$link = $repoWorkspaceUser->findOneBy(Array("Workspace" => $this->groupId, "User" => $lastOwner ? $resGroupUserId : $resInvitedUserId));
			}
			else {
				$link = $repoWorkspaceUser->findOneBy(Array("Workspace" => $this->groupId, "mail" => "test@email.com"));
			}
			if ($link == null) {
				print_r($resDeletion);
			}

			$this->assertNotEquals(null, $link, "Test " . $errorLabel . "  (mail : " . $email . ") : membre supprimé malgré une erreur");

			$memberCount = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Workspace")->findOneById($this->groupId)->getMemberCount();
			$this->assertEquals(1, $memberCount, "Test " . $errorLabel . "  (mail : " . $email . ") : nombre de membres du groupe mauvais");
		}

		// Suppresssion des entités
		$this->removeGroup($this->groupId);
		$this->deleteUser("email1@test.com");
		$this->deleteUser("email2@test.com");
		$this->deleteUser("email3@test.com");
	}

	public function checkCorrect($email) {

		// Création des entités nécessaires
		$this->createUser("GroupMember", "email1@test.com", "Password0");
		$this->createUser("InvitedMember", "email2@test.com", "Password0");
		$this->createUser("OtherMember", "email3@test.com", "Password0");

		$this->login("GroupMember", "Password0");
		$this->groupId = $this->createGroup()["gid"];

		$resInvitedUserId = $this->api("/ajax/users/get", Array("username" => "InvitedMember"))['data']['idUser'];
		$this->login("GroupMember", "Password0");

		if (!$email) {
			$this->deleteMemberFromGroup($this->groupId, Array(), Array($resInvitedUserId));
			$this->inviteUserInGroup($this->groupId, "InvitedMember");
		}
		else {
			$this->deleteMemberFromGroup($this->groupId, Array("test@email.com"), Array());
			$this->inviteUserInGroup($this->groupId, "test@email.com");
		}

		// Connection
		$this->login("GroupMember", "Password0");

		// Suppression
		if (!$email) {
			$resDeletion = $this->deleteMemberFromGroup($this->groupId, Array(), Array($resInvitedUserId));
		}
		else {
			$resDeletion = $this->deleteMemberFromGroup($this->groupId, Array("test@email.com"), Array());
		}

		// Tests
		$this->assertNotEquals(null, $resDeletion, "Test correct (mail : " . $email . ") : erreur 500");
		$this->assertEquals(0, count($resDeletion["errors"]), "Test correct  (mail : " . $email . ") : mauvais nombre d'erreurs retournées");

		if (!$email) {
			$link = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("Workspace" => $this->groupId, "User" => $resInvitedUserId));
		}
		else {
			$link = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("Workspace" => $this->groupId, "mail" => "test@email.com"));
		}

		$this->assertEquals(null, $link, "Test correct (mail : " . $email . ") : membre non supprimé du groupe dans la base de données");

		$memberCount = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Workspace")->findOneById($this->groupId)->getMemberCount();
		$this->assertEquals(1, $memberCount, "Test correct (mail : " . $email . ") : nombre de membres du groupe mauvais");

		// Suppresssion des entités
		$this->removeGroup($this->groupId);
		$this->deleteUser("email1@test.com");
		$this->deleteUser("email2@test.com");
		$this->deleteUser("email3@test.com");
	}

	public function testNotConnected() {

		$this->checkError(false, "notallowed", false, false, true, true, false, true);
		$this->checkError(true, "notallowed", false, false, true, true, false, true);
	}

	public function testBadGroup() {

		$this->checkError(false, "nosuchgroup", true, true, true, true, false, true);
		$this->checkError(true, "nosuchgroup", true, true, true, true, false, true);
	}

	public function testNoRight() {

		$this->checkError(false, "notallowed", true, false, true, false, false, true);
		$this->checkError(true, "notallowed", true, false, true, false, false, true);
	}

	public function testLastOwner() {

		$this->checkError(false, "lastowner", true, false, true, true, true, true);
	}

	public function testUserNotFound() {

		$this->checkError(false, "usernotfound", true, false, true, true, false, false);
	}

	public function testMailNotFound() {

		$this->checkError(true, "mailnotfound", true, false, true, true, false, false);
	}

	public function testOk() {

		$this->checkCorrect(false);
		$this->checkCorrect(true);
	}
}
