<?php

namespace Tests\WebsiteApi\Controller;

use Tests\WebTestCaseExtended;

class GroupsUserRightsTest extends WebTestCaseExtended
{
    public function testIndex()
    {
        $ret = $this->createUser("UnitTestB1","UnitTestB1@citigo.fr", "UnitTestB1");
        $userRes = $this->login();
        $this->gid = $this->createGroup()["gid"];
        $this->inviteUserInGroup($this->gid,"UnitTestB1");
        $this->login("UnitTestB1","UnitTestB1");
        $this->acceptGroupInvitation($this->gid);
        $this->logout();
        $this->login();
        $res = $this->api('/ajax/group/members/table',Array("limit" => 50,"offset" => 0,"groupId" => $this->gid));
        foreach($res["data"]["members"] as $user){
            if($user["username"] == "UnitTestB1"){
                $this->otherIdUser = $user["id"];
            }
        }


        $this->createLevel();

        $lvls = $this->api("/ajax/group/rights/getlevels",Array("groupId"=>$this->gid))["data"];
        $this->levels = Array();
        foreach($lvls as $level){
            $this->levels[$level["nameLevel"]] = $level["idLevel"];
        }

        $this->updateLevel();
        $this->changeLevel();
        $this->deleteLevel();

        $this->removeGroup($this->gid);
        $this->logout();
        $this->deleteUser("UnitTestB1@citigo.fr");

    }



    private function changeLevel(){
        $this->login();
            $res = $this->api('/ajax/group/members/changelevel', Array(
                "groupId" => $this->gid,
                "uids" => Array($this->otherIdUser),
                "levelId" => $this->levels["testLevel"],
            ));
            $res = $this->api('/ajax/group/members/table',Array(
                    "limit" => 50,
                    "offset" => 0,
                    "groupId" => $this->gid,
                ));
            foreach($res["data"]["members"] as $user){
                if($user["id"] == $this->otherIdUser){
                    $lvl = $user["role"];
                }
            }
            $this->assertEquals($lvl,"testLevel",  "LevelChangeUser-- Erreur lors du test final");
    }

    private function deleteLevel(){
        // test si on peut faire quelque chose si on n'est pas co


        // test de l'existance du level
        $this->login("UnitTestB1","UnitTestB1");

            $res = $this->api('/ajax/group/rights/deleteLevels', Array(
                "groupId"=>$this->gid,
                "levelId"=>-1,
            ));
            $this->assertContains("levelNotFound",$res["errors"], "LevelDelete-- Accès a un level qui n'existe pas ");


            // test de l'existance du goupe
            $res = $this->api('/ajax/group/rights/deleteLevels', Array(
                "groupId"=>-1,
                "levelId"=>$this->levels["Admin"],
            ));
            $this->assertContains("workspaceNotFound",$res["errors"],  "LevelDelete-- Accès à un level qui n'existe pas");



        // test des droits de l'utilisateur
        $this->login("UnitTestB1","UnitTestB1");
            $res = $this->api('/ajax/group/rights/deleteLevels', Array(
                "groupId"=>$this->gid,
                "levelId"=>$this->levels["testLevel"],
            ));



            //$this->assertContains("accessDenied",$res["errors"],  "LevelDelete-- Possibilite de détruire un level sans en avoir le droit ");


        // test is default
        $this->login();
            $res = $this->api('/ajax/group/rights/deleteLevels', Array(
                "groupId"=>$this->gid,
                "levelId"=>$this->levels["Default"],
            ));
            $this->assertContains("levelDefault",$res["errors"], "LevelDelete-- Possibilité de détruire un level défault");


            // test is admin
            $res = $this->api('/ajax/group/rights/deleteLevels', Array(
                "groupId"=>$this->gid,
                "levelId"=>$this->levels["Admin"],
            ));
            $this->assertContains("levelOwner", $res["errors"], "LevelDelete-- Possibilité de détruire un level admin");

        // test final


            $res = $this->api('/ajax/group/rights/deleteLevels', Array(
                "groupId"=>$this->gid,
                "levelId"=>$this->levels["testLevel"], // channel
            ));
            $lvls = $this->api("/ajax/group/rights/getlevels",Array("groupId"=>$this->gid))["data"];
            $this->assertEquals(2,count($lvls),"LevelDelete-- Erreur de suppresion de level");


    }




    private function updateLevel(){

        $res = $this->api('/ajax/group/rights/deleteLevels', Array(
            "groupId"=>$this->gid,
            "levelId"=>-1,
        ));
        $this->assertContains("levelNotFound",$res["errors"], "LevelUpdate-- Accès a un level qui n'existe pas ");


        // test de l'existance du goupe
        $res = $this->api('/ajax/group/rights/deleteLevels', Array(
            "groupId"=>-1,
            "levelId"=>$this->levels["Default"],
        ));
        $this->assertContains("workspaceNotFound",$res["errors"],  "LevelUpdate-- Accès à un level qui n'existe pas");



        // test des droits de l'utilisateur
        $this->login("UnitTestB1","UnitTestB1");
            $res = $this->api('/ajax/group/rights/deleteLevels', Array(
                "groupId"=>$this->gid,
                "levelId"=>$this->levels["Default"],
            ));
            $this->assertContains("accessDenied",$res["errors"],  "LevelUpdate-- Possibilite de détruire un level sans en avoir le droit ");

        //test final
        $this->login();
        $res = $this->api('/ajax/group/rights/updateLevel', Array(
            "groupId" => $this->gid,
            "levelId" => $this->levels["Default"],
            "rights" =>  Array("base"=>"oups"),
            "name" => "Default",
		));

        $lvls = $this->api("/ajax/group/rights/getlevels",Array("groupId"=>$this->gid))["data"];

        foreach($lvls as $lvl){
            if($lvl['nameLevel']=="Default"){
                $updatedLevels = $lvl;
            }
        }
        $this->assertContains("oups",$updatedLevels["right"],  "LevelUpdate-- problème update");

    }









    public function createLevel(){
        // test si on peut créer des droits sur un groupe inexistant

        $this->login();
        $res = $this->api('/ajax/group/rights/createlevel', Array(
            "groupId"=>"-1",
            "name"=>"testLevel",
        ));
        $this->assertContains("groupnotfound",$res["errors"],  "LevelCreation-- Test creation level pour groupe inxistant");


        // tes si on peut créer un level sans en avoir le droits


        $res = $this->login("UnitTestB1","UnitTestB1");
        $res = $this->api('/ajax/group/rights/createlevel', Array(
            "groupId"=>$this->gid,
            "name"=>"testLevel",
        ));
        $this->assertContains("accessDenied",$res["errors"],  "LevelCreation-- Acces a la creation de level sans le droit");

        //test final de creation
        $this->login();
        $res = $this->api('/ajax/group/rights/createlevel', Array(
            "groupId"=>$this->gid,
            "name"=>"testLevel",
        ));
        $lvls = $this->api("/ajax/group/rights/getlevels",Array("groupId"=>$this->gid))["data"];
        $this->assertEquals(3,count($lvls));
    }
}
