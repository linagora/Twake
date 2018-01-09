<?php

namespace Tests\WebsiteApi\Controller;

use Tests\WebTestCaseExtended;

class GroupCreateDeleteTest extends WebTestCaseExtended
{
	public function checkError($error, $connected = false, $emptyname = false, $type = "O", $privacy = "P", $parents = Array()) {

		if ($connected) {
			$this->login();
		}
		else {
			$this->logout();
		}

		$res = $this->createGroup($emptyname, $type, $privacy, $parents);
		$this->assertNotEquals(null, $res, "Test " . $error . " : erreur 500");
		$this->assertEquals(1, count($res["errors"]), "Test " . $error . " : mauvais nombre d'erreurs retournées");
		$this->assertEquals($error, $res["errors"][0], "Test " . $error . " : mauvaise erreur retournée");
	}

	public function checkCorrectCreation($checkEntity, $type, $privacy, $parents = Array()) {

		$this->login();
		$resGroup = $this->createGroup(false, $type, $privacy, $parents);

		// Verification du retour de la requête
		$this->assertEquals(0, count($resGroup["errors"]), "Test création correcte : une erreur a été retournée");
		$this->assertTrue(isset($resGroup["gid"]), "Test création correcte : aucun gid n'a été retrouvé");
		$this->assertGreaterThan(0, $resGroup["gid"], "Test création correcte : le gid retourné n'est pas strictement positif");

		if ($checkEntity) {

			// Verification de l"entité dans la BDD
			$groupEntity = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:Workspace")->findOneById($resGroup["gid"]);
			$this->assertNotEquals(null, $groupEntity, "Test création correcte : l'entité du groupe est introuvable dans la base de données");
			$this->assertEquals("Group name", $groupEntity->getName(), "Test création correcte : mauvais nom");
			$this->assertEquals("groupname", $groupEntity->getCleanName(), "Test création correcte : mauvais nom clean");
			$this->assertEquals($type, $groupEntity->getType(), "Test création correcte : mauvais type");
			$this->assertEquals("Group description", $groupEntity->getDescription(), "Test création correcte : mauvaise description");
			$this->assertEquals(1, $groupEntity->getMemberCount(), "Test création correcte : mauvais nombre de membre");
			$this->assertEquals($privacy, $groupEntity->getPrivacy(), "Test création correcte : mauvaise visibilité");
			$this->assertEquals("Group street", $groupEntity->getStreet(), "Test création correcte : mauvaise rue");
			$this->assertEquals("Group city", $groupEntity->getCity(), "Test création correcte : mauvaise ville");
			$this->assertEquals("ZIP", $groupEntity->getZipCode(), "Test création correcte : mauvais code postal");
			$this->assertEquals("Group country", $groupEntity->getCountry(), "Test création correcte : mauvais pays");
			$this->assertEquals(Array("0123456789", "9876543210"), $groupEntity->getPhones(), "Test création correcte : mauvais téléphones");
			$this->assertEquals(Array("email@email.com", "email2@email.com"), $groupEntity->getEmails(), "Test création correcte : mauvais emails");
			$this->assertEquals("Group RNA", $groupEntity->getRna(), "Test création correcte : mauvais rna");
			$this->assertEquals("Group siret", $groupEntity->getSiret(), "Test création correcte : mauvais siret");

			// Verification du lien entre le createur du groupe et le groupe
			$membersLinks = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findBy(Array("Workspace" => $groupEntity));
			$this->assertEquals(1, count($membersLinks), "Test création correcte : mauvais nombre de membres dans l'entité");

			$resCurrentUser = $this->api("/ajax/users/current/get", Array());
			$user = $this->getDoctrine()->getRepository("TwakeUsersBundle:User")->findOneById($resCurrentUser["data"]["uid"]);
			$this->assertEquals(1, count($membersLinks), "Test création correcte : mauvais nombre de membres dans l'entité");
			$this->assertEquals($user->getId(), $membersLinks[0]->getUser()->getId(), "Test création correcte : mauvais utilisateur ajouté au groupe");
		}

		$this->removeGroup($resGroup["gid"]);
	}

	public function testSimpleErrors() {

		$this->checkError("notconnected", false);
		$this->checkError("emptyName", true, true);
		$this->checkError("badType", true, false, "Z");
		$this->checkError("badPrivacy", true, false, "O", "Z");
	}

	public function testCorrectCreation() {

		$this->checkCorrectCreation(true, "P", "P");
		$this->checkCorrectCreation(false, "C", "Q");
		$this->checkCorrectCreation(false, "A", "M");
		$this->checkCorrectCreation(false, "E", "P");
		$this->checkCorrectCreation(false, "I", "Q");
		$this->checkCorrectCreation(false, "O", "M");
	}

	public function testBadParent() {

		$this->login();
		$resBadGroup = $this->createGroup(false, "O", "P", Array(0));
		$this->assertEquals(1, count($resBadGroup["errors"]), "Test parentNotFound : mauvais nombre d'erreurs retrounées");
		$this->assertEquals(Array("parentNotFound" => 0), $resBadGroup["errors"][0], "Test parentNotFound : mauvaise erreur retournée");
	}

	public function testGoodParent() {

		$this->login();
		$resGroup1 = $this->createGroup();
		$resGroup2 = $this->createGroup();

		$this->checkCorrectCreation(true, "O", "P", Array($resGroup1["gid"], $resGroup2["gid"]));

		$this->removeGroup($resGroup1["gid"]);
		$this->removeGroup($resGroup2["gid"]);
	}

	public function testGroupRemoval() {

		$this->login();
		$resCreation = $this->createGroup();
		$resRemoval = $this->removeGroup($resCreation["gid"]);
		$this->assertEquals(Array(), $resRemoval["errors"], "ERROR !!!");
	}
}
