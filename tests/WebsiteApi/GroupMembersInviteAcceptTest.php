<?php

namespace Tests\WebsiteApi\Controller;

use Tests\WebTestCaseExtended;

class GroupMembersInviteAcceptTest extends WebTestCaseExtended
{
	public function checkError($errorLabel, $connected, $wrongGroupId, $invited) {

		// Création des entités nécessaires
		$this->createUser("GroupMember", "email1@test.com", "Password0");
		$this->createUser("InvitedMember", "email2@test.com", "Password0");

		$this->login("GroupMember", "Password0");
		$groupId = $wrongGroupId ? 0 : $this->createGroup()["gid"];

		// Invitation
		if ($invited) {
			$this->inviteUserInGroup($groupId, "InvitedMember");
		}

		// Acceptation
		if ($connected) {
			$this->login("InvitedMember", "Password0");
		}
		else {
			$this->logout();
		}

		$resAcceptation = $this->acceptGroupInvitation($groupId);

		// Tests
		$this->assertNotEquals(null, $resAcceptation, "Test " . $errorLabel . " : erreur 500");
		$this->assertEquals(1, count($resAcceptation["errors"]), "Test " . $errorLabel . " : mauvais nombre d'erreurs retournées");
		$this->assertEquals($errorLabel, $resAcceptation["errors"][0], "Test " . $errorLabel . " : mauvaise erreur retournée");

		if (!$wrongGroupId) {
			$memberCount = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Workspace")->findOneById($groupId)->getMemberCount();
			$this->assertEquals(1, $memberCount, "Test " . $errorLabel . " : nombre de membres du groupe mauvais");
		}

		// Suppression des entités
		$this->removeGroup($groupId);
		$this->deleteUser("email1@test.com");
		$this->deleteUser("email2@test.com");
	}

	public function testNotConnected() {
		$this->checkError("notconnected", false, false, true);
	}

	public function testGroupNotFound() {
		$this->checkError("groupnotfound", true, true, true);
	}

	public function testNoInvitation() {
		$this->checkError("noinvitation", true, false, false);
	}

	public function testCorrect() {

		// Création des entités nécessaires
		$this->createUser("GroupMember", "email1@test.com", "Password0");
		$this->createUser("InvitedMember", "email2@test.com", "Password0");

		$this->login("GroupMember", "Password0");
		$groupId = $this->createGroup()["gid"];
		$this->inviteUserInGroup($groupId, "InvitedMember");

		// Acceptation
		$this->login("InvitedMember", "Password0");
		$resAcceptation = $this->acceptGroupInvitation($groupId);

		// Tests
		$this->assertNotEquals(null, $resAcceptation, "Test correct : erreur 500");
		$this->assertEquals(0, count($resAcceptation["errors"]), "Test correct : mauvais nombre d'erreurs retournées");

		// Tests sur la base de données
		$userId = $this->api("/ajax/users/current/get", Array())["data"]["uid"];
		$userGroupLink = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("Workspace" => $groupId, "User" => $userId));
		$this->assertEquals("A", $userGroupLink->getStatus(), "Test correct : membre non accepté");

		$memberCount = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Workspace")->findOneById($groupId)->getMemberCount();
		$this->assertEquals(2, $memberCount, "Test correct : nombre de membres du groupe mauvais");

		// Suppression des entités
		$this->removeGroup($groupId);
		$this->deleteUser("email1@test.com");
		$this->deleteUser("email2@test.com");
	}
}
