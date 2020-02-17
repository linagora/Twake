<?php

namespace Tests\DriveBundle;

require_once __DIR__ . "/../WebTestCaseExtended.php";

use Tests\WebTestCaseExtended;
use Twake\Workspaces\Entity\Workspace;
use Twake\Workspaces\Entity\Group;
use Twake\Workspaces\Entity\WorkspaceUser;
use Twake\Workspaces\Entity\GroupUser;

class DriveCollectionTest extends WebTestCaseExtended
{
    public function testSaveFile()
    {

        // ON CREE UN GROUP POUR CREER NOTRE WORKSPACE
        $group = new Group("group_for_test");
        $this->getDoctrine()->persist($group);

        // ON CREE UN WORKSPACE POUR FAIRE NOS TESTS SUR LES FICHIERS
        $workspace = new Workspace("workspace_for_test");
        $workspace->setGroup($group);
        $this->getDoctrine()->persist($workspace);
        $this->getDoctrine()->persist($group);
        $this->getDoctrine()->flush();
        $workspace_id = $workspace->getId() . "";

        // ON RECUPERE LA RACINE DE CE NOUVEAU WORKSPACE
        $root = $this->get("app.drive")->getRootEntity($workspace_id);
        $root_id = $root->getId() . "";
        //error_log(print_r("root id: " . $root_id,true));


        //ON RECUPERE LA CORBEILLE DE CE NOUVEAU WORKSPACE
        $trash = $this->get("app.drive")->getTrashEntity($workspace_id);
        $trash_id = $trash->getId() . "";
        //error_log(print_r("trash id: " .$trash_id,true));

        //ON CREEE UN USER POUR FAIRE NOS TEST ET ON LE CONNECTE

        $this->removeUserByName("usertest001");
        $user1 = $this->newUserByName("usertest001");

        $this->login($user1->getUsernameCanonical());
        $result = $this->doPost("/ajax/users/current/get", Array());
        $user1_id = $result["data"]["id"];
        $current_date = new \DateTime();
        $current_date = $current_date->getTimestamp();

        $workspaceUser1 = new WorkspaceUser($workspace, $user1, null);
        $groupUser1 = new GroupUser($group, $user1);
        $this->getDoctrine()->persist($workspaceUser1);
        $this->getDoctrine()->persist($workspace);
        $this->getDoctrine()->persist($user1);
        $this->getDoctrine()->persist($groupUser1);
        $this->getDoctrine()->persist($group);
        $this->getDoctrine()->flush();


// =================================================================================================================================================
// =================================================================================================================================================

        //ON CREE UN FICHIER QUI VA SE TROUVER A LA RACINE DU WORKSPACE EN SPECIFIANT UN PARENT

        $object = Array("parent_id" => $root_id, "trash" => false, "workspace_id" => $workspace_id, "front_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "name" => "filefortest", "is_directory" => false);
        $data = Array("upload_mode" => "chunk", "identifier" => "identifier", "nb_chunk" => 1);
        $options = Array();
        $result = $this->doPost("/ajax/drive/save", Array(
            "object" => $object,
            "options" => $options,
        ));
        $idtofind_parent = $result["data"]["object"]["id"];

        $this->assertEquals($workspace_id, $result["data"]["object"]["workspace_id"], "Wrong workspace id for file create with a parent " . json_encode($result));
        $this->assertEquals($root_id, $result["data"]["object"]["parent_id"], "Wrong parent id for file create with a parent");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005", $result["data"]["object"]["front_id"], "Wrong front id for file create with a parent");
        $this->assertEquals("filefortest", $result["data"]["object"]["name"], "Wrong name for file create with a parent");
        $this->assertEquals(false, $result["data"]["object"]["trash"], "Wrong is in trash attribut for file create with a parent");
        $this->assertEquals($user1_id, $result["data"]["object"]["last_user"], "Wrong last user for file create with a parent");

        $added_parent = $result["data"]["object"]["added"];
        $modified_parent = $result["data"]["object"]["modified"];
        $this->assertLessThan(60, $modified_parent - $current_date, "Problem with date modified of filed create with a parent");
        $this->assertLessThan(60, $added_parent - $current_date, "Problem with date added of filed create with a parent");
        $this->assertEquals($modified_parent, $added_parent, "Added date and modified date should be the same");


        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals($workspace_id, $fileordirectory->getWorkspaceId() . "", "Wrong workspace id for file create with a parent in database");
        $this->assertEquals($root_id, $fileordirectory->getParentId() . "", "Wrong parent id for file create with a parent in database");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005", $fileordirectory->getFrontId() . "", "Wrong front id for file create with a parent in database");
        $this->assertEquals("filefortest", $fileordirectory->getName(), "Wrong name for file create with a parent in database");
        $this->assertEquals(false, $fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");


// =================================================================================================================================================
// =================================================================================================================================================

        // ON CREE UN FICHIER QUI VA SE TROUVER A LA RACINE DU WORKSPACE SANS SPECIFIER UN PARENT

        $object = Array("parent_id" => $root_id, "trash" => false, "workspace_id" => $workspace_id, "front_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "name" => "filefortest-randomothername", "is_directory" => false);
        $options = Array();
        $result = $this->doPost("/ajax/drive/save", Array(
            "object" => $object,
            "options" => $options
        ));
        $idtofind_root = $result["data"]["object"]["id"];

        $this->assertEquals($workspace_id, $result["data"]["object"]["workspace_id"], "Wrong workspace id for file create without a parent");
        $this->assertEquals($root_id, $result["data"]["object"]["parent_id"], "Wrong parent id for file create without a parent");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005", $result["data"]["object"]["front_id"], "Wrong front id for file create without a parent");
        $this->assertEquals("filefortest-randomothername", $result["data"]["object"]["name"], "Wrong name for file create without a parent");
        $this->assertEquals(false, $result["data"]["object"]["trash"], "Wrong is in trash attribut for file create without a parent");
        $this->assertEquals($user1_id, $result["data"]["object"]["last_user"], "Wrong last user for file create without a parent");

        $added = $result["data"]["object"]["added"];
        $modified = $result["data"]["object"]["modified"];
        $this->assertLessThan(60, $modified - $current_date, "Problem with date modified of filed create with a parent");
        $this->assertLessThan(60, $added - $current_date, "Problem with date added of filed create with a parent");
        $this->assertEquals($modified, $added, "Added date and modified date should be the same");


        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_root));
        $this->assertEquals($workspace_id, $fileordirectory->getWorkspaceId() . "", "Wrong workspace id for file create without a parent in database");
        $this->assertEquals($root_id, $fileordirectory->getParentId() . "", "Wrong parent id for file create without a parent in database");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005", $fileordirectory->getFrontId() . "", "Wrong front id for file create without a parent in database");
        $this->assertEquals(false, $fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");


// =================================================================================================================================================
// =================================================================================================================================================
        // ON CREE UN FICHIER DETACHED

        $object = Array("workspace_id" => $workspace_id, "trash" => false, "front_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "name" => "filefortest-randomothername2", "detached" => true, "is_directory" => false);
        $options = Array("new" => true, "data" => $data, "version" => true);
        $result = $this->doPost("/ajax/drive/save", Array(
            "object" => $object,
            "options" => $options

        ));
        $idtofind_detached = $result["data"]["object"]["id"];

        $this->assertEquals($workspace_id, $result["data"]["object"]["workspace_id"], "Wrong workspace id for file create detached");
        $this->assertEquals("detached", $result["data"]["object"]["parent_id"], "Wrong parent id for file create detached");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005", $result["data"]["object"]["front_id"], "Wrong front id for file create detached");
        $this->assertEquals(true, $result["data"]["object"]["detached"], "Wrong detached bool for file create without a parent detached");
        $this->assertEquals("filefortest-randomothername2", $result["data"]["object"]["name"], "Wrong name for file create detached");
        $this->assertEquals(false, $result["data"]["object"]["trash"], "Wrong is in trash attribut for file create detached");
        $this->assertEquals($user1_id, $result["data"]["object"]["last_user"], "Wrong last user for file create detached");

        /*$fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(200000, $fileordirectory->getAsArray()["size"], "Wrong size for the file root");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0, $fileordirectory->getAsArray()["size"], "Wrong size for the file in trash");
*/

        $added = $result["data"]["object"]["added"];
        $modified = $result["data"]["object"]["modified"];
        $this->assertLessThan(60, $modified - $current_date, "Problem with date modified of filed create with a parent");
        $this->assertLessThan(60, $added - $current_date, "Problem with date added of filed create with a parent");
        $this->assertEquals($modified, $added, "Added date and modified date should be the same");


        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($workspace_id, $fileordirectory->getWorkspaceId() . "", "Wrong workspace id for file create without a parent in database");
        $this->assertEquals("detached", $fileordirectory->getParentId() . "", "Wrong parent id for file create without a parent in database");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005", $fileordirectory->getFrontId() . "", "Wrong front id for file create without a parent in database");
        $this->assertEquals(true, $fileordirectory->getDetachedFile(), "Wrong detached bool for file create without a parent detached in database");
        $this->assertEquals(false, $fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");

// =================================================================================================================================================
// =================================================================================================================================================

        //ON VA ATTACHER LE FICHIER DETACHED CREE PRECEDEMENT A LA RACINE

        $object = Array("id" => $idtofind_detached, "parent_id" => $root_id);
        $options = Array();
        $result = $this->doPost("/ajax/drive/save", Array(
            "object" => $object,
            "options" => $options
        ));

        $this->assertEquals($workspace_id, $result["data"]["object"]["workspace_id"], "Wrong workspace id for file reatached");
        $this->assertEquals($root_id, $result["data"]["object"]["parent_id"], "Wrong parent id for file reatached");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005", $result["data"]["object"]["front_id"], "Wrong front id for file reatached");
        $this->assertEquals(false, $result["data"]["object"]["detached"], "Wrong detached bool for file reatached");
        $this->assertEquals(false, $result["data"]["object"]["trash"], "Wrong is in trash attribut for file create with a parent");

        //error_log(print_r(json_decode($result->getContent(),true),true));
        /*$this->assertEquals(100000,$result["data"]["object"]["size"], "Wrong size for file create without a parent");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(300000, $fileordirectory->getAsArray()["size"], "Wrong size for the file root");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0, $fileordirectory->getAsArray()["size"], "Wrong size for the file in trash");*/

        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($workspace_id, $fileordirectory->getWorkspaceId() . "", "Wrong workspace id for file reatached");
        $this->assertEquals($root_id, $fileordirectory->getParentId() . "", "Wrong parent id for file reatached");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005", $fileordirectory->getFrontId() . "", "Wrong front id for file reatached");
        $this->assertEquals(false, $fileordirectory->getDetachedFile(), "Wrong detached bool for file reatached");
        $this->assertEquals(false, $fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");

// =================================================================================================================================================
// =================================================================================================================================================
        //ON VA METTRE LE FICHIER PARENT A LA CORBEILLE ET REGARDER SI LES TAILLES SONT CORRECTES

        $object = Array("id" => $idtofind_parent, "trash" => true);
        $options = Array();
        $result = $this->doPost("/ajax/drive/save", Array(
            "object" => $object,
            "options" => $options
        ));

        //error_log(print_r($result->getContent(),true));
        $this->assertEquals(true, $result["data"]["object"]["trash"], "File should be in trash he is not");

        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals($trash_id, $fileordirectory->getParentId(), "File has nottrash as parent");
        $this->assertEquals($root_id, $fileordirectory->getOldParent(), "File has nottrash as parent");

        /*$this->assertEquals(100000,$result["data"]["object"]["size"], "Wrong size for the file");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the file in database");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(200000, $fileordirectory->getAsArray()["size"], "Wrong size for the file root");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the file in trash");*/


// =================================================================================================================================================
// =================================================================================================================================================
        //ON VA RESTAURER LE FICHIER DEPLACE SUR SON PARENT ET REGARDER SI LES TAILLES SONT CORRECTES

        $object = Array("id" => $idtofind_parent, "trash" => false);
        $options = Array();
        $result = $this->doPost("/ajax/drive/save", Array(
            "object" => $object,
            "options" => $options
        ));

        $this->assertEquals(false, $result["data"]["object"]["trash"], "File should not be in trash he is ");

        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals($root_id, $fileordirectory->getParentId(), "File has notroot as parent");
        $this->assertEquals("", $fileordirectory->getOldParent(), "File got old parent he should not");

        /*$this->assertEquals(100000,$result["data"]["object"]["size"], "Wrong size for the file");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the file in database");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(300000, $fileordirectory->getAsArray()["size"], "Wrong size for the file root");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0, $fileordirectory->getAsArray()["size"], "Wrong size for the file trash");*/


// =================================================================================================================================================
// =================================================================================================================================================
        // ON CREE UN DOSSIER A LA RACINE

        $object = Array("workspace_id" => $workspace_id, "front_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "name" => "folderfortest", "is_directory" => true);
        $options = Array("new" => true, "data" => $data, "version" => true);
        $result = $this->doPost("/ajax/drive/save", Array(
            "object" => $object,
            "options" => $options,
        ));
        $idtofind_folder = $result["data"]["object"]["id"];

        $this->assertEquals($workspace_id, $result["data"]["object"]["workspace_id"], "Wrong workspace id for the folder ");
        $this->assertEquals($root_id, $result["data"]["object"]["parent_id"], "Wrong parent id for the folder");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005", $result["data"]["object"]["front_id"], "Wrong front id for the folder");
        $this->assertEquals("folderfortest", $result["data"]["object"]["name"], "Wrong name for the folder");
        $this->assertEquals(false, $result["data"]["object"]["trash"], "Wrong is in trash attribut for the folder");
        $this->assertEquals($user1_id, $result["data"]["object"]["last_user"], "Wrong last user for the folder");
        $this->assertEquals(0, $result["data"]["object"]["size"], "Wrong size for the folder");

        /*$this->assertEquals(0,$result["data"]["object"]["size"], "Wrong size for the folder");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the file in database");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(300000, $fileordirectory->getAsArray()["size"], "Wrong size for the file root");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0, $fileordirectory->getAsArray()["size"], "Wrong size for the file trash");*/

// =================================================================================================================================================
// =================================================================================================================================================

        //ON VA ATTACHER LE FICHIER DETACHED CREE PRECEDEMENT AU DOSSIER QU ON VIENT DE CREER

        $object = Array("id" => $idtofind_detached, "parent_id" => $idtofind_folder);
        $options = Array();
        $result = $this->doPost("/ajax/drive/save", Array(
            "object" => $object,
            "options" => $options
        ));

        $this->assertEquals($workspace_id, $result["data"]["object"]["workspace_id"], "Wrong workspace id for file reatached");
        $this->assertEquals($idtofind_folder, $result["data"]["object"]["parent_id"], "Wrong parent id for file reatached");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005", $result["data"]["object"]["front_id"], "Wrong front id for file reatached");
        $this->assertEquals(false, $result["data"]["object"]["detached"], "Wrong detached bool for file reatached");
        $this->assertEquals(false, $result["data"]["object"]["trash"], "Wrong is in trash attribut for file create with a parent");

        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($idtofind_folder, $fileordirectory->getParentId() . "", "Wrong parent for the file which should be in folder");

        //error_log(print_r($result,true));
        /*$this->assertEquals(100000,$result["data"]["object"]["size"], "Wrong size for file detached");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(300000, $fileordirectory->getAsArray()["size"], "Wrong size for the file root");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0, $fileordirectory->getAsArray()["size"], "Wrong size for the file in trash");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_folder));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the folder");*/

// =================================================================================================================================================
// =================================================================================================================================================

        //ON MET LE DOSSIER CREE A LA CORBEILLE ET DONC LE FICHIER DETACHED EN MEME TEMPS

        $object = Array("id" => $idtofind_folder, "trash" => true);
        $options = Array();
        $result = $this->doPost("/ajax/drive/save", Array(
            "object" => $object,
            "options" => $options
        ));

        $this->assertEquals(true, $result["data"]["object"]["trash"], "Folder should be in trash he is not");

        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_folder));
        $this->assertEquals($trash_id, $fileordirectory->getParentId(), "Folder as not trash as parent");
        $this->assertEquals($root_id, $fileordirectory->getOldParent(), "Folder as not trash as parent");
        $this->assertEquals(true, $fileordirectory->getIsInTrash(), "Folder as not trash as parent");

        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($idtofind_folder, $fileordirectory->getParentId(), "Folder as not trash as parent");
        $this->assertEquals("", $fileordirectory->getOldParent(), "Folder as not trash as parent");
        $this->assertEquals(true, $fileordirectory->getIsInTrash(), "Folder as not trash as parent");

        /*$this->assertEquals(100000,$result["data"]["object"]["size"], "Wrong size for the folder");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the file in database");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(200000, $fileordirectory->getAsArray()["size"], "Wrong size for the file root");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the file in trash");*/

// =================================================================================================================================================
// =================================================================================================================================================

        //ON VA RESTAURER LE FICHIER DETACHED QUI SE TROUVE DANS LE DOSSIER LUI MEME A LA CORBEILLE ET VOIR SI IL SE RESTAURE A LA RACINE

        $object = Array("id" => $idtofind_detached, "trash" => false);
        $options = Array();
        $result = $this->doPost("/ajax/drive/save", Array(
            "object" => $object,
            "options" => $options
        ));

        $fileson = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findBy(Array("workspace_id" => $workspace_id, "parent_id" => $idtofind_detached));

        $this->assertEquals(false, $result["data"]["object"]["trash"], "Detached file should not be in trash he is ");

        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($root_id, $fileordirectory->getParentId(), "Detached file as not trash as parent");
        $this->assertEquals("", $fileordirectory->getOldParent(), "Detached file as not trash as parent");
        $this->assertEquals(false, $fileordirectory->getIsInTrash(), "Detached file as not trash as parent");

        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_folder));
        $this->assertEquals($trash_id, $fileordirectory->getParentId(), "Folder as not trash as parent");
        $this->assertEquals($root_id, $fileordirectory->getOldParent(), "Folder as not trash as parent");
        $this->assertEquals(true, $fileordirectory->getIsInTrash(), "Folder as not trash as parent");

        /*$this->assertEquals(100000,$result["data"]["object"]["size"], "Wrong size for the file");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the file in database");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(300000, $fileordirectory->getAsArray()["size"], "Wrong size for the file root");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0, $fileordirectory->getAsArray()["size"], "Wrong size for the file in trash");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_folder));
        $this->assertEquals(0, $fileordirectory->getAsArray()["size"], "Wrong size for the file in trash");*/

// =================================================================================================================================================
// =================================================================================================================================================

        //ON SUPPRIME LE FICHIER DETACHED

        $object = Array("id" => $idtofind_detached);
        $options = Array();
        $result = $this->doPost("/ajax/drive/remove", Array(
            "object" => $object,
            "options" => $options
        ));

        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals(null, $fileordirectory, "The deleted file still exist");

        /*$fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(200000, $fileordirectory->getAsArray()["size"], "Wrong size for the file root");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0, $fileordirectory->getAsArray()["size"], "Wrong size for the file trash");*/

// =================================================================================================================================================
// =================================================================================================================================================

        // ON DEPLACE LE FICHIER PARENT EN LE RATACHANT A UN FICHIER DE LA CORBEILLE

        $object = Array("id" => $idtofind_parent, "parent_id" => $idtofind_folder);
        $options = Array();
        $result = $this->doPost("/ajax/drive/save", Array(
            "object" => $object,
            "options" => $options
        ));


        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals($idtofind_folder, $fileordirectory->getParentId(), "File has nottrash as parent");
        $this->assertEquals($root_id, $fileordirectory->getOldParent(), "File has notroot as old parent");
        $this->assertEquals(true, $fileordirectory->getIsInTrash(), "File is not in trash");

        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_folder));
        $this->assertEquals($trash_id, $fileordirectory->getParentId(), "Folder is not trash as parent");
        $this->assertEquals(true, $fileordirectory->getIsInTrash(), "Folder is not in trash");

        $this->assertEquals(true, $result["data"]["object"]["trash"], "Folder should be in trash he is not");

        /*$fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_folder));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the file in trash");
        $this->assertEquals(100000,$result["data"]["object"]["size"], "Wrong size for the folder");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the file in database");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the file root");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the file in trash");*/

        //ET ON LE SUPPRIME

        $object = Array("id" => $idtofind_parent);
        $options = Array();
        $result = $this->doPost("/ajax/drive/remove", Array(
            "object" => $object,
            "options" => $options
        ));

        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals(null, $fileordirectory, "The deleted file still exist");

        /*$fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0, $fileordirectory->getAsArray()["size"], "Wrong size for the file trash");
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(100000, $fileordirectory->getAsArray()["size"], "Wrong size for the file root");*/

// =================================================================================================================================================
// =================================================================================================================================================

        // ON SUPPRIME TOUS LES FICHIERS DU WORKSPACE, LE WORKSPACE EN LUI MEME AINSI QUE LE GROUPE

        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findBy(Array("workspace_id" => $workspace_id));
        foreach ($fileordirectory as $item) {
            $this->getDoctrine()->remove($item);
        }
        $workspace = $this->getDoctrine()->getRepository("Twake\Workspaces:Workspace")->findOneBy(Array("id" => $workspace_id));
        $this->getDoctrine()->remove($workspace);
        $group = $this->getDoctrine()->getRepository("Twake\Workspaces:Group")->findOneBy(Array("id" => $group->getId() . ""));
        $this->getDoctrine()->remove($group);
        $this->getDoctrine()->flush();


        $group = $this->getDoctrine()->getRepository("Twake\Workspaces:Group")->findOneBy(Array("id" => $group->getId() . ""));
        $this->assertEquals(null, $group);
        $workspace = $this->getDoctrine()->getRepository("Twake\Workspaces:Workspace")->findOneBy(Array("id" => $workspace_id));
        $this->assertEquals(null, $workspace);
        $fileordirectory = $this->getDoctrine()->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("workspace_id" => $workspace_id));
        $this->assertEquals(null, $fileordirectory);


        //ON SUPPRIME TOUTE LES VERSIONS QUI ONT ETE CREE
        $version = $this->getDoctrine()->getRepository("Twake\Drive:DriveFileVersion")->findBy(Array("file_id" => $idtofind_parent));
        foreach ($version as $v) {
            $this->getDoctrine()->remove($v);
            $this->getDoctrine()->flush();
        }
        $version = $this->getDoctrine()->getRepository("Twake\Drive:DriveFileVersion")->findBy(Array("file_id" => $idtofind_parent));
        $this->assertEquals(Array(), $version);


        $version = $this->getDoctrine()->getRepository("Twake\Drive:DriveFileVersion")->findBy(Array("file_id" => $idtofind_root));
        foreach ($version as $v) {
            $this->getDoctrine()->remove($v);
            $this->getDoctrine()->flush();
        }
        $version = $this->getDoctrine()->getRepository("Twake\Drive:DriveFileVersion")->findBy(Array("file_id" => $idtofind_root));
        $this->assertEquals(Array(), $version);

        $version = $this->getDoctrine()->getRepository("Twake\Drive:DriveFileVersion")->findBy(Array("file_id" => $idtofind_detached));
        foreach ($version as $v) {
            $this->getDoctrine()->remove($v);
            $this->getDoctrine()->flush();
        }
        $version = $this->getDoctrine()->getRepository("Twake\Drive:DriveFileVersion")->findBy(Array("file_id" => $idtofind_detached));
        $this->assertEquals(Array(), $version);

    }
}