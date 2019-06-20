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

        //ON RECUPERE LA CORBEILLE DE CE NOUVEAU WORKSPACE
        $trash = $this->get("app.drive_refacto")->getTrashEntity($workspace_id);
        $trash_id = $trash->getId()."";

// =================================================================================================================================================
// =================================================================================================================================================

        //ON CREE UN FICHIER QUI VA SE TROUVER A LA RACINE DU WORKSPACE EN SPECIFIANT UN PARENT

        $object = Array("parent_id" => $root_id, "workspace_id" => $workspace_id, "front_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "name" => "filefortest");
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));
        $idtofind_parent = json_decode($result->getContent(),true)["data"]["object"]["id"];

        $this->assertEquals($workspace_id,json_decode($result->getContent(),true)["data"]["object"]["workspace_id"], "Wrong workspace id for file create with a parent");
        $this->assertEquals($root_id,json_decode($result->getContent(),true)["data"]["object"]["parent_id"],"Wrong parent id for file create with a parent");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",json_decode($result->getContent(),true)["data"]["object"]["front_id"], "Wrong front id for file create with a parent");
        $this->assertEquals("filefortest",json_decode($result->getContent(),true)["data"]["object"]["name"], "Wrong name for file create with a parent");
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Wrong is in trash attribut for file create with a parent");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals($workspace_id,$fileordirectory->getWorkspaceId()."", "Wrong workspace id for file create with a parent in database");
        $this->assertEquals($root_id,$fileordirectory->getParentId()."", "Wrong parent id for file create with a parent in database");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",$fileordirectory->getFrontId()."", "Wrong front id for file create with a parent in database");
        $this->assertEquals("filefortest",$fileordirectory->getName(), "Wrong name for file create with a parent in database");
        $this->assertEquals(false,$fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");

// =================================================================================================================================================
// =================================================================================================================================================

        // ON CREE UN FICHIER QUI VA SE TROUVER A LA RACINE DU WORKSPACE SANS SPECIFIER UN PARENT

        $object = Array("workspace_id" => $workspace_id, "front_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "name" => "filefortest");
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));
        $idtofind_root = json_decode($result->getContent(),true)["data"]["object"]["id"];

        $this->assertEquals($workspace_id,json_decode($result->getContent(),true)["data"]["object"]["workspace_id"], "Wrong workspace id for file create without a parent");
        $this->assertEquals($root_id,json_decode($result->getContent(),true)["data"]["object"]["parent_id"], "Wrong parent id for file create without a parent");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",json_decode($result->getContent(),true)["data"]["object"]["front_id"], "Wrong front id for file create without a parent" );
        $this->assertEquals("filefortest",json_decode($result->getContent(),true)["data"]["object"]["name"], "Wrong name for file create with a parent");
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Wrong is in trash attribut for file create with a parent");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_root));
        $this->assertEquals($workspace_id,$fileordirectory->getWorkspaceId()."", "Wrong workspace id for file create with outa parent in database");
        $this->assertEquals($root_id,$fileordirectory->getParentId()."", "Wrong parent id for file create without a parent in database");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",$fileordirectory->getFrontId()."", "Wrong front id for file create without a parent in database");
        $this->assertEquals("filefortest",$fileordirectory->getName(), "Wrong name for file create with a parent in database");
        $this->assertEquals(false,$fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");

// =================================================================================================================================================
// =================================================================================================================================================

        // ON CREE UN FICHIER DETACHED

        $object = Array("workspace_id" => $workspace_id, "front_id" => "14005200-48b1-11e9-a0b4-0242ac120005", "name" => "filefortest", "detached" => true);
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));
        $idtofind_detached = json_decode($result->getContent(),true)["data"]["object"]["id"];

        $this->assertEquals($workspace_id,json_decode($result->getContent(),true)["data"]["object"]["workspace_id"], "Wrong workspace id for file create detached");
        $this->assertEquals("detached",json_decode($result->getContent(),true)["data"]["object"]["parent_id"], "Wrong parent id for file create detached");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",json_decode($result->getContent(),true)["data"]["object"]["front_id"], "Wrong front id for file create detached" );
        $this->assertEquals(true,json_decode($result->getContent(),true)["data"]["object"]["detached"], "Wrong detached bool for file create without a parent detached" );
        $this->assertEquals("filefortest",json_decode($result->getContent(),true)["data"]["object"]["name"], "Wrong name for file create with a parent");
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Wrong is in trash attribut for file create with a parent");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($workspace_id,$fileordirectory->getWorkspaceId()."", "Wrong workspace id for file create without a parent in database");
        $this->assertEquals("detached",$fileordirectory->getParentId()."", "Wrong parent id for file create without a parent in database");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",$fileordirectory->getFrontId()."", "Wrong front id for file create without a parent in database");
        $this->assertEquals(true,$fileordirectory->getDetachedFile(), "Wrong detached bool for file create without a parent detached in database" );
        $this->assertEquals("filefortest",$fileordirectory->getName(), "Wrong name for file create with a parent in database");
        $this->assertEquals(false,$fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");

// =================================================================================================================================================
// =================================================================================================================================================

        //ON VA ATTACHER LE FICHIER DETACHED CREE PRECEDEMENT AU PREMIER FICHIER CREE A LA RACINE

        $object = Array("id" => $idtofind_detached, "parent_id" => $idtofind_parent);
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));

        $this->assertEquals($workspace_id,json_decode($result->getContent(),true)["data"]["object"]["workspace_id"], "Wrong workspace id for file reatached");
        $this->assertEquals($idtofind_parent,json_decode($result->getContent(),true)["data"]["object"]["parent_id"], "Wrong parent id for file reatached");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",json_decode($result->getContent(),true)["data"]["object"]["front_id"], "Wrong front id for file reatached" );
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["detached"], "Wrong detached bool for file reatached" );
        $this->assertEquals("filefortest",json_decode($result->getContent(),true)["data"]["object"]["name"], "Wrong name for file reatached");
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Wrong is in trash attribut for file create with a parent");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($workspace_id,$fileordirectory->getWorkspaceId()."", "Wrong workspace id for file reatached");
        $this->assertEquals($idtofind_parent,$fileordirectory->getParentId()."", "Wrong parent id for file reatached");
        $this->assertEquals("14005200-48b1-11e9-a0b4-0242ac120005",$fileordirectory->getFrontId()."", "Wrong front id for file reatached");
        $this->assertEquals(false,$fileordirectory->getDetachedFile(), "Wrong detached bool for file reatached" );
        $this->assertEquals("filefortest",$fileordirectory->getName(), "Wrong name for file create reatached");
        $this->assertEquals(false,$fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");

// =================================================================================================================================================
// =================================================================================================================================================

        //ON VA PRENDRE LE PREMIER FICHIER LUI METTRE UNE TAILLE ET TENTER DE LE METTER SUR LE SECONDE
        // POUR VOIR SI LE CHANGEMENT DE TAILLE SE FAIT BIEN


        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $fileordirectory->setSize(150000);
        $root =  $this->get("app.drive_refacto")->getRootEntity($workspace_id);
        $root->setSize(150000);
        $this->get("app.twake_doctrine")->persist($fileordirectory);
        $this->get("app.twake_doctrine")->persist($root);
        $this->get("app.twake_doctrine")->flush();

        //NOS TAILLE SONT SET COMME DANS UNE SITUATION REELLE

        $object = Array("id" => $idtofind_parent, "parent_id" => $idtofind_root);
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));
        $this->assertEquals(150000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for the file");
        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "Wrong is in trash attribut for file create with a parent");

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals(150000,$fileordirectory->getSize(), "Wrong size for the file in database");
        $this->assertEquals(false,$fileordirectory->getIsInTrash(), "Wrong is in trash attribut for file create with a parent in database");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_root));
        $this->assertEquals(150000,$fileordirectory->getSize(), "Wrong size for the file parent in database");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(150000,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals($idtofind_parent,$fileordirectory->getParentId()."", "Wrong parent ID after the parent of the parent change. The son didn't got a update on his parent id");

// =================================================================================================================================================
// =================================================================================================================================================
        //ON VA METTRE LE FICHIER DEPLACE A LA CORBEILLE ET REGARDER SI LES TAILLES SONT CORRECTES

        $object = Array("id" => $idtofind_parent, "trash" => true);
        $options = Array();
        $result = $this->doPost("/ajax/drive/saverefacto", Array(
            "object" => $object,
            "options" => $options
        ));

        //error_log(print_r($result->getContent(),true));
        $this->assertEquals(true,json_decode($result->getContent(),true)["data"]["object"]["trash"], "File should be in trash he is not");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
        $this->assertEquals(true,$fileordirectory->getIsInTrash(), "Son should be in trash he is not");

        $this->assertEquals(150000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for the file");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
        $this->assertEquals(150000,$fileordirectory->getSize(), "Wrong size for the file in database");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_root));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file parent in database");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file root");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
        $this->assertEquals(150000,$fileordirectory->getSize(), "Wrong size for the file trash");




// =================================================================================================================================================
// =================================================================================================================================================
//        //ON VA RESTAURER LE FICHIER DEPLACE SUR SON PARENT ET REGARDER SI LES TAILLES SONT CORRECTES

//        $object = Array("id" => $idtofind_parent, "trash" => false);
//        $options = Array();
//        $result = $this->doPost("/ajax/drive/saverefacto", Array(
//            "object" => $object,
//            "options" => $options
//        ));
//
//        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "File should not be in trash he is ");
//        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_detached));
//        $this->assertEquals(false,$fileordirectory->getIsInTrash(), "Son should be not be in trash but he is");
//
//        $this->assertEquals(150000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for the file");
//        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
//        $this->assertEquals(150000,$fileordirectory->getSize(), "Wrong size for the file in database");
//        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_root));
//        $this->assertEquals(150000,$fileordirectory->getSize(), "Wrong size for the file parent in database");
//        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
//        $this->assertEquals(150000,$fileordirectory->getSize(), "Wrong size for the file root");
//        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
//        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file trash");

// =================================================================================================================================================
// =================================================================================================================================================
        //ON REMET LE FICHIER A LA CORBEILLE ET ON TENTE DE RESTAURER L UN DE SES FILS QUI DOIT DONC SE TROUVER A LA RACINE

//        $object = Array("id" => $idtofind_parent, "trash" => true);
//        $options = Array();
//        $result = $this->doPost("/ajax/drive/saverefacto", Array(
//            "object" => $object,
//            "options" => $options
//        ));
//
//        $object = Array("id" => $idtofind_detached, "trash" => false);
//        $options = Array();
//        $result = $this->doPost("/ajax/drive/saverefacto", Array(
//            "object" => $object,
//            "options" => $options
//        ));
//
//        //error_log(print_r($result->getContent(),true));
//        $this->assertEquals(false,json_decode($result->getContent(),true)["data"]["object"]["trash"], "File should not be in trash he is ");
//        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
//        $this->assertEquals(true,$fileordirectory->getIsInTrash(), "parent should be in trash but he is not");
//        $this->assertEquals($root_id,$fileordirectory->getParentId()."", "parent should be in trash but he is not");
//
//        $this->assertEquals(150000,json_decode($result->getContent(),true)["data"]["object"]["size"], "Wrong size for the file");
//        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_parent));
//        $this->assertEquals(150000,$fileordirectory->getSize(), "Wrong size for the file in database");
//        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_root));
//        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file parent in database");
//        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $root_id));
//        $this->assertEquals(0,$fileordirectory->getSize(), "Wrong size for the file root");
//        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $trash_id));
//        $this->assertEquals(150000,$fileordirectory->getSize(), "Wrong size for the file trash");



// =================================================================================================================================================
// =================================================================================================================================================


// =================================================================================================================================================
// =================================================================================================================================================

        //ON SUPPRIME LE FICHIER QU ON VIENS DE DEPLACER ET QUI A DONC LUI MEME UN FILS

        $object = Array("id" => $idtofind_root);
        $options = Array();
        $result = $this->doPost("/ajax/drive/removerefacto", Array(
            "object" => $object,
            "optionss" => $options
        ));

        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findOneBy(Array("id" => $idtofind_root));
        $this->assertEquals(null,$fileordirectory, "The deleted file still exist");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array("workspace_id" => $workspace_id, "parent_id" => $idtofind_root));
        $this->assertEquals(Array(),$fileordirectory, "One of the son of the deleted file still exist");
        $fileordirectory = $this->get("app.twake_doctrine")->getRepository("TwakeDriveBundle:DriveFile")->findBy(Array("workspace_id" => $workspace_id, "parent_id" => $idtofind_parent));
        $this->assertEquals(Array(),$fileordirectory, "One of the grandson of the deleted file still exist");

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

    }


}