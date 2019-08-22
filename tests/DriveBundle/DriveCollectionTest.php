<?php

namespace Tests\DriveBundle;

use Tests\WebTestCaseExtended;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\Group;

class DriveCollectionTest extends WebTestCaseExtended
{
    public function testSaveFile(){

        // ON CREE UN GROUP POUR CREER NOTRE WORKSPACE
        $group = new Group("group_for_test");
        $this->get("app.twake_doctrine")->persist($group);

        // ON CREE UN WORKSPACE POUR FAIRE NOS TESTS SUR LES FICHIERS
        $workspace = new Workspace("workspace_for_test");
        $workspace->setGroup($group);
        $this->get("app.twake_doctrine")->persist($workspace);
        $this->get("app.twake_doctrine")->flush();
        $workspace_id = $workspace->getId()."";

        // ON RECUPERE LA RACINE DE CE NOUVEAU WORKSPACE
        $root =  $this->get("app.drive_refacto")->getRootEntity($workspace_id);
        $root_id = $root->getId()."";
        //error_log(print_r("root id: " . $root_id,true));


        //ON RECUPERE LA CORBEILLE DE CE NOUVEAU WORKSPACE
        $trash = $this->get("app.drive_refacto")->getTrashEntity($workspace_id);
        $trash_id = $trash->getId()."";
        //error_log(print_r("trash id: " .$trash_id,true));

        //ON CREEE UN USER POUR FAIRE NOS TEST ET ON LE CONNECTE

        $this->removeUserByName("usertest001");
        $this->newUserByName("usertest001");

        $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));
        $result = $this->doPost("/ajax/users/current/get", Array());
        $user1_id = json_decode($result->getContent(),true)["data"]["id"];
        $current_date = new \DateTime();
        $current_date = $current_date->getTimestamp();

// =================================================================================================================================================
// =================================================================================================================================================

        //ON CREE UN FICHIER QUI VA SE TROUVER A LA RACINE DU WORKSPACE EN SPECIFIANT UN PARENT

        $data = Array("upload_mode" => "chunk", "identifier" => "identifier", "nb_chunk" => 1);
        $upload_data = Array("data" => $data, "size" => 100000);

        $object = Array("parent_id" => $root_id, "workspace_id" => $workspace_id, "front_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "name" => "filefortest", "is_directory" => false);
        $data = Array("upload_mode" => "chunk", "identifier" => "identifier" ,"nb_chunk" => 1);
        $options = Array("new" => true, "data" => $data, "version" => true);
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options,
            "upload_data" => $upload_data
        ));
        $idtofind_parent = json_decode($result->getContent(),true)["data"]["object"]["id"];


        $this->assertEquals($workspace_id,json_decode($result->getContent(),true)["data"]["object"]["workspace_id"], "Wrong workspace id for file create with a parent");
        $this->assertEquals($root_id,json_decode($result->getContent(),true)["data"]["object"]["parent_id"],"Wrong parent id for file create with a parent");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",json_decode($result->getContent(),true)["data"]["object"]["front_id"], "Wrong front id for file create with a parent");
        $this->assertEquals("filefortest",json_decode($result->getContent(),true)["data"]["object"]["name"], "Wrong name for file create with a parent");
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Wrong is in trash attribut for file create with a parent");
        $this->assertEquals($user1_id,json_decode($result->getContent(),true)["data"]["object"]["last_user"], "Wrong last user for file create with a parent");
        $this->assertEquals(100000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for file create with a parent");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file in trash");


        $added_parent = json_decode($result->getContent(),true)["data"]["object"]["added"];
        $modified_parent = json_decode($result->getContent(),true)["data"]["object"]["modified"];
        $this->assertLessThan(60,$modified_parent-$current_date, "Problem with date modified of filed create with a parent");
        $this->assertLessThan(60,$added_parent-$current_date, "Problem with date added of filed create with a parent");
        $this->assertEquals($modified_parent,$added_parent, "Added date and modified date should be the same");


        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals($workspace_id,$fileordirectory->getWorkspaceId()."", "Wrong workspace id for file create with a parent in database");
        $this->assertEquals($root_id,$fileordirectory->getParentId()."", "Wrong parent id for file create with a parent in database");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",$fileordirectory->getFrontId()."", "Wrong front id for file create with a parent in database");
        $this->assertEquals("filefortest",$fileordirectory->getName(), "Wrong name for file create with a parent in database");
        $this->assertEquals(false,$fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");

        //test sur le versionning de ce fichier
        $version = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFileVersion")->findOneBy(Array("file_id" => $idtofind_parent));
        $this->assertEquals("filefortest",$version->getFileName(), "Wrong name for the version");
        $this->assertEquals($idtofind_parent,$version->getFileId(), "Wrong file id for the version");
        $this->assertEquals("identifier",$version->getData()["identifier"], "Wrong identifier");
        $this->assertEquals("chunk",$version->getData()["upload_mode"], "Upload_mode should be chunk it is not");
        $this->assertEquals(1,$version->getData()["nb_chunk"], "Wrong chunk number");
        $this->assertEquals($user1_id,$version->getUserId(), "Wrong user creator for the version");

        $this->get("app.twake_doctrine")->remove($version);
        $this->get("app.twake_doctrine")->flush();


// =================================================================================================================================================
// =================================================================================================================================================

        // ON CREE UN FICHIER QUI VA SE TROUVER A LA RACINE DU WORKSPACE SANS SPECIFIER UN PARENT

        $object = Array("workspace_id" => $workspace_id, "front_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "name" => "filefortest", "is_directory" => false);
        $options = Array("new" => true, "data" => $data, "version" => true);
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options,
            "upload_data" => $upload_data
        ));
        $idtofind_root = json_decode($result->getContent(),true)["data"]["object"]["id"];

        $this->assertEquals($workspace_id,json_decode($result->getContent(),true)["data"]["object"]["workspace_id"], "Wrong workspace id for file create without a parent");
        $this->assertEquals($root_id,json_decode($result->getContent(),true)["data"]["object"]["parent_id"], "Wrong parent id for file create without a parent");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",json_decode($result->getContent(),true)["data"]["object"]["front_id"], "Wrong front id for file create without a parent" );
        $this->assertEquals("filefortest",json_decode($result->getContent(),true)["data"]["object"]["name"], "Wrong name for file create without a parent");
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Wrong is in trash attribut for file create without a parent");
        $this->assertEquals($user1_id,json_decode($result->getContent(),true)["data"]["object"]["last_user"], "Wrong last user for file create without a parent");
        $this->assertEquals(100000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for file create without a parent");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(200000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file in trash");

        $added = json_decode($result->getContent(),true)["data"]["object"]["added"];
        $modified = json_decode($result->getContent(),true)["data"]["object"]["modified"];
        $this->assertLessThan(60,$modified-$current_date, "Problem with date modified of filed create with a parent");
        $this->assertLessThan(60,$added-$current_date, "Problem with date added of filed create with a parent");
        $this->assertEquals($modified,$added, "Added date and modified date should be the same");


        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_root));
        $this->assertEquals($workspace_id,$fileordirectory->getWorkspaceId()."", "Wrong workspace id for file create without a parent in database");
        $this->assertEquals($root_id,$fileordirectory->getParentId()."", "Wrong parent id for file create without a parent in database");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",$fileordirectory->getFrontId()."", "Wrong front id for file create without a parent in database");
        $this->assertEquals("filefortest",$fileordirectory->getName(), "Wrong name for file create with a parent in database");
        $this->assertEquals(false,$fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");

        $version = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFileVersion")->findOneBy(Array("file_id" => $idtofind_root));
        $this->assertEquals("filefortest",$version->getFileName(), "Wrong name for the version");
        $this->assertEquals($idtofind_root,$version->getFileId(), "Wrong file id for the version");
        $this->assertEquals("identifier",$version->getData()["identifier"], "Wrong identifier");
        $this->assertEquals("chunk",$version->getData()["upload_mode"], "Upload_mode should be chunk it is not");
        $this->assertEquals(1,$version->getData()["nb_chunk"], "Wrong chunk number");
        $this->assertEquals($user1_id,$version->getUserId(), "Wrong user creator for the version");

        $this->get("app.twake_doctrine")->remove($version);
        $this->get("app.twake_doctrine")->flush();


// =================================================================================================================================================
// =================================================================================================================================================
        // ON CREE UN FICHIER DETACHED

        $object = Array("workspace_id" => $workspace_id, "front_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "name" => "filefortest", "detached" => true, "is_directory" => false);
        $options = Array("new" => true, "data" => $data, "version" => true);
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options,
            "upload_data" => $upload_data

        ));
        $idtofind_detached = json_decode($result->getContent(),true)["data"]["object"]["id"];

        $this->assertEquals($workspace_id,json_decode($result->getContent(),true)["data"]["object"]["workspace_id"], "Wrong workspace id for file create detached");
        $this->assertEquals("detached",json_decode($result->getContent(),true)["data"]["object"]["parent_id"], "Wrong parent id for file create detached");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",json_decode($result->getContent(),true)["data"]["object"]["front_id"], "Wrong front id for file create detached" );
        $this->assertEquals(true,json_decode($result->getContent(),true)["data"]["object"]["detached"], "Wrong detached bool for file create without a parent detached" );
        $this->assertEquals("filefortest",json_decode($result->getContent(),true)["data"]["object"]["name"], "Wrong name for file create detached");
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Wrong is in trash attribut for file create detached");
        $this->assertEquals($user1_id,json_decode($result->getContent(),true)["data"]["object"]["last_user"], "Wrong last user for file create detached");
        $this->assertEquals(100000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for file create detached");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(200000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file in trash");


        $added = json_decode($result->getContent(),true)["data"]["object"]["added"];
        $modified = json_decode($result->getContent(),true)["data"]["object"]["modified"];
        $this->assertLessThan(60,$modified-$current_date, "Problem with date modified of filed create with a parent");
        $this->assertLessThan(60,$added-$current_date, "Problem with date added of filed create with a parent");
        $this->assertEquals($modified,$added, "Added date and modified date should be the same");


        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($workspace_id,$fileordirectory->getWorkspaceId()."", "Wrong workspace id for file create without a parent in database");
        $this->assertEquals("detached",$fileordirectory->getParentId()."", "Wrong parent id for file create without a parent in database");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",$fileordirectory->getFrontId()."", "Wrong front id for file create without a parent in database");
        $this->assertEquals(true,$fileordirectory->getDetachedFile(), "Wrong detached bool for file create without a parent detached in database" );
        $this->assertEquals("filefortest",$fileordirectory->getName(), "Wrong name for file create with a parent in database");
        $this->assertEquals(false,$fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");

        $version = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFileVersion")->findOneBy(Array("file_id" => $idtofind_detached));
        $this->assertEquals("filefortest",$version->getFileName(), "Wrong name for the version");
        $this->assertEquals($idtofind_detached,$version->getFileId(), "Wrong file id for the version");
        $this->assertEquals($user1_id,$version->getUserId(), "Wrong user creator for the version");

        $this->get("app.twake_doctrine")->remove($version);
        $this->get("app.twake_doctrine")->flush();

// =================================================================================================================================================
// =================================================================================================================================================

        //ON VA ATTACHER LE FICHIER DETACHED CREE PRECEDEMENT A LA RACINE

        $object = Array("id" => $idtofind_detached, "parent_id" => $root_id);
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));

        $this->assertEquals($workspace_id,json_decode($result->getContent(),true)["data"]["object"]["workspace_id"], "Wrong workspace id for file reatached");
        $this->assertEquals($root_id,json_decode($result->getContent(),true)["data"]["object"]["parent_id"], "Wrong parent id for file reatached");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",json_decode($result->getContent(),true)["data"]["object"]["front_id"], "Wrong front id for file reatached" );
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["detached"], "Wrong detached bool for file reatached" );
        $this->assertEquals("filefortest",json_decode($result->getContent(),true)["data"]["object"]["name"], "Wrong name for file reatached");
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Wrong is in trash attribut for file create with a parent");

        //error_log(print_r(json_decode($result->getContent(),true),true));
        $this->assertEquals(100000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for file create without a parent");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(300000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file in trash");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($workspace_id,$fileordirectory->getWorkspaceId()."", "Wrong workspace id for file reatached");
        $this->assertEquals($root_id,$fileordirectory->getParentId()."", "Wrong parent id for file reatached");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",$fileordirectory->getFrontId()."", "Wrong front id for file reatached");
        $this->assertEquals(false,$fileordirectory->getDetachedFile(), "Wrong detached bool for file reatached" );
        $this->assertEquals("filefortest",$fileordirectory->getName(), "Wrong name for file create reatached");
        $this->assertEquals(false,$fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");

// =================================================================================================================================================
// =================================================================================================================================================
        //ON VA METTRE LE FICHIER PARENT A LA CORBEILLE ET REGARDER SI LES TAILLES SONT CORRECTES

        $object = Array("id" => $idtofind_parent, "trash" => true);
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));

        //error_log(print_r($result->getContent(),true));
        $this->assertEquals(true,json_decode($result->getContent(),true)["data"]["object"]["trash"], "File should be in trash he is not");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals($trash_id, $fileordirectory->getParentId(), "File has nottrash as parent");
        $this->assertEquals($root_id, $fileordirectory->getOldParent(), "File has nottrash as parent");

        $this->assertEquals(100000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for the file");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file in database");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(200000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file in trash");


// =================================================================================================================================================
// =================================================================================================================================================
        //ON VA RESTAURER LE FICHIER DEPLACE SUR SON PARENT ET REGARDER SI LES TAILLES SONT CORRECTES

        $object = Array("id" => $idtofind_parent, "trash" => false);
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));

        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "File should not be in trash he is ");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals($root_id, $fileordirectory->getParentId(), "File has notroot as parent");
        $this->assertEquals("",$fileordirectory->getOldParent(), "File got old parent he should not");

        $this->assertEquals(100000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for the file");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file in database");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(300000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file trash");


// =================================================================================================================================================
// =================================================================================================================================================
        // ON CREE UN DOSSIER A LA RACINE

        $object = Array("workspace_id" => $workspace_id, "front_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "name" => "folderfortest", "is_directory" => true);
        $options = Array("new" => true, "data" => $data, "version" => true);
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options,
        ));
        $idtofind_folder = json_decode($result->getContent(),true)["data"]["object"]["id"];

        $this->assertEquals($workspace_id,json_decode($result->getContent(),true)["data"]["object"]["workspace_id"], "Wrong workspace id for the folder ");
        $this->assertEquals($root_id,json_decode($result->getContent(),true)["data"]["object"]["parent_id"], "Wrong parent id for the folder");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",json_decode($result->getContent(),true)["data"]["object"]["front_id"], "Wrong front id for the folder" );
        $this->assertEquals("folderfortest",json_decode($result->getContent(),true)["data"]["object"]["name"], "Wrong name for the folder");
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Wrong is in trash attribut for the folder");
        $this->assertEquals($user1_id,json_decode($result->getContent(),true)["data"]["object"]["last_user"], "Wrong last user for the folder");
        $this->assertEquals(0,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for the folder");

        $this->assertEquals(0,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for the folder");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file in database");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(300000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file trash");

// =================================================================================================================================================
// =================================================================================================================================================

        //ON VA ATTACHER LE FICHIER DETACHED CREE PRECEDEMENT AU DOSSIER QU ON VIENT DE CREER

        $object = Array("id" => $idtofind_detached, "parent_id" => $idtofind_folder);
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));

        $this->assertEquals($workspace_id,json_decode($result->getContent(),true)["data"]["object"]["workspace_id"], "Wrong workspace id for file reatached");
        $this->assertEquals($idtofind_folder,json_decode($result->getContent(),true)["data"]["object"]["parent_id"], "Wrong parent id for file reatached");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",json_decode($result->getContent(),true)["data"]["object"]["front_id"], "Wrong front id for file reatached" );
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["detached"], "Wrong detached bool for file reatached" );
        $this->assertEquals("filefortest",json_decode($result->getContent(),true)["data"]["object"]["name"], "Wrong name for file reatached");
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Wrong is in trash attribut for file create with a parent");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($idtofind_folder,$fileordirectory->getParentId()."", "Wrong parent for the file which should be in folder");

        //error_log(print_r(json_decode($result->getContent(),true),true));
        $this->assertEquals(100000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for file detached");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(300000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file in trash");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_folder));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the folder");

// =================================================================================================================================================
// =================================================================================================================================================

        //ON MET LE DOSSIER CREE A LA CORBEILLE ET DONC LE FICHIER DETACHED EN MEME TEMPS

        $object = Array("id" => $idtofind_folder, "trash" => true);
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));

        $this->assertEquals(true,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Folder should be in trash he is not");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_folder));
        $this->assertEquals($trash_id,$fileordirectory->getParentId(), "Folder as not trash as parent");
        $this->assertEquals($root_id,$fileordirectory->getOldParent(), "Folder as not trash as parent");
        $this->assertEquals(true,$fileordirectory->getIsInTrash(), "Folder as not trash as parent");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($idtofind_folder,$fileordirectory->getParentId(), "Folder as not trash as parent");
        $this->assertEquals("",$fileordirectory->getOldParent(), "Folder as not trash as parent");
        $this->assertEquals(true,$fileordirectory->getIsInTrash(), "Folder as not trash as parent");

        $this->assertEquals(100000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for the folder");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file in database");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(200000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file in trash");

// =================================================================================================================================================
// =================================================================================================================================================

        //ON VA RESTAURER LE FICHIER DETACHED QUI SE TROUVE DANS LE DOSSIER LUI MEME A LA CORBEILLE ET VOIR SI IL SE RESTAURE A LA RACINE

        $object = Array("id" => $idtofind_detached, "trash" => false);
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));

        $fileson = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array("workspace_id" => $workspace_id, "parent_id" => $idtofind_detached));

        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Detached file should not be in trash he is ");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($root_id,$fileordirectory->getParentId(), "Detached file as not trash as parent");
        $this->assertEquals("",$fileordirectory->getOldParent(), "Detached file as not trash as parent");
        $this->assertEquals(false,$fileordirectory->getIsInTrash(), "Detached file as not trash as parent");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_folder));
        $this->assertEquals($trash_id,$fileordirectory->getParentId(), "Folder as not trash as parent");
        $this->assertEquals($root_id,$fileordirectory->getOldParent(), "Folder as not trash as parent");
        $this->assertEquals(true,$fileordirectory->getIsInTrash(), "Folder as not trash as parent");

        $this->assertEquals(100000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for the file");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file in database");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(300000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file in trash");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_folder));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file in trash");

// =================================================================================================================================================
// =================================================================================================================================================

        //ON SUPPRIME LE FICHIER DETACHED

        $object = Array("id" => $idtofind_detached);
        $options = Array();
        $result = $this->doPost("/ajax/drive/removerefacto", Array(
            "object" => $object,
            "optionss" => $options
        ));

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals(null,$fileordirectory, "The deleted file still exist");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(200000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file trash");

// =================================================================================================================================================
// =================================================================================================================================================

        // ON DEPLACE LE FICHIER PARENT EN LE RATACHANT A UN FICHIER DE LA CORBEILLE

        $object = Array("id" => $idtofind_parent, "parent_id" => $idtofind_folder);
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));


        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals($idtofind_folder, $fileordirectory->getParentId(), "File has nottrash as parent");
        $this->assertEquals($root_id, $fileordirectory->getOldParent(), "File has notroot as old parent");
        $this->assertEquals(true,$fileordirectory->getIsInTrash(), "File is not in trash");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_folder));
        $this->assertEquals($trash_id,$fileordirectory->getParentId(), "Folder is not trash as parent");
        $this->assertEquals(true,$fileordirectory->getIsInTrash(), "Folder is not in trash");

        $this->assertEquals(true,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Folder should be in trash he is not");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_folder));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file in trash");
        $this->assertEquals(100000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for the folder");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file in database");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file in trash");

        //ET ON LE SUPPRIME

        $object = Array("id" => $idtofind_parent);
        $options = Array();
        $result = $this->doPost("/ajax/drive/removerefacto", Array(
            "object" => $object,
            "optionss" => $options
        ));

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals(null,$fileordirectory, "The deleted file still exist");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file trash");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(100000,$fileordirectory->getSize(), "Wrong size for the file root");

// =================================================================================================================================================
// =================================================================================================================================================

        //ON RECUPERE UN FICHIER A L AIDE DE LA METHODE GET

        $options = Array("id" => $root_id);
        $result = $this->doPost("/ajax/drive/getrefacto", Array(
            "options" => $options
        ));
        $this->assertEquals($root_id,json_decode($result->getContent(),true)["data"]["id"], "Wrong file found or null");

// =================================================================================================================================================
// =================================================================================================================================================
        //ON RECUPERE LA RACINE D UN WORKSPACE A L AIDE DE LA METHODE GET

        $options = Array("workspace_id" => $workspace_id);
        $result = $this->doPost("/ajax/drive/getrefacto", Array(
            "options" => $options
        ));
        $this->assertEquals($root_id,json_decode($result->getContent(),true)["data"]["id"], "The file is not the root of the workspace");

// =================================================================================================================================================
// =================================================================================================================================================

        // ON SUPPRIME TOUS LES FICHIERS DU WORKSPACE, LE WORKSPACE EN LUI MEME AINSI QUE LE GROUPE

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array("workspace_id" => $workspace_id));
        foreach ($fileordirectory as $item) {
            $this->get("app.twake_doctrine")->remove($item);
        }
        $workspace = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace_id));
        $this->get("app.twake_doctrine")->remove($workspace);
        $group = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Group")->findOneBy(Array("id" => $group->getId().""));
        $this->get("app.twake_doctrine")->remove($group);
        $this->get("app.twake_doctrine")->flush();


        $group = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Group")->findOneBy(Array("id" => $group->getId().""));
        $this->assertEquals(null,$group);
        $workspace = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace_id));
        $this->assertEquals(null,$workspace);
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("workspace_id" => $workspace_id));
        $this->assertEquals(null,$fileordirectory);


        //ON SUPPRIME TOUTE LES VERSIONS QUI ONT ETE CREE
        $version = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFileVersion")->findBy(Array("file_id" => $idtofind_parent));
        foreach ($version as $v){
            $this->get("app.twake_doctrine")->remove($v);
            $this->get("app.twake_doctrine")->flush();
        }
        $version = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFileVersion")->findBy(Array("file_id" => $idtofind_parent));
        $this->assertEquals(Array(),$version);


        $version = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFileVersion")->findBy(Array("file_id" => $idtofind_root));
        foreach ($version as $v){
            $this->get("app.twake_doctrine")->remove($v);
            $this->get("app.twake_doctrine")->flush();
        }
        $version = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFileVersion")->findBy(Array("file_id" => $idtofind_root));
        $this->assertEquals(Array(),$version);

        $version = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFileVersion")->findBy(Array("file_id" => $idtofind_detached));
        foreach ($version as $v){
            $this->get("app.twake_doctrine")->remove($v);
            $this->get("app.twake_doctrine")->flush();
        }
        $version = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFileVersion")->findBy(Array("file_id" => $idtofind_detached));
        $this->assertEquals(Array(),$version);

    }
}