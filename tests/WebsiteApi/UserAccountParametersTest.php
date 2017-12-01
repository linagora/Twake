<?php

namespace Tests\WebsiteApi\Controller;

use Tests\WebTestCaseExtended;

class UserAccountParametersTest extends WebTestCaseExtended
{

    public function testIndex(){
        $this->login();

        /****************************/
        /* Récupération des données */
        /****************************/
        // Success Case

        $res = $this->api('/ajax/users/account/parameters', Array(
        ));

        $this->assertEmpty($res["errors"], "Get errors: ".json_encode($res));


        // Data Verification

        $this->assertEquals("UnitTest", $res["data"]["username"], "get Username error".json_encode($res));
        $this->assertEquals("UnitTest@citigo.fr", $res["data"]["email"], "get Email error".json_encode($res));
        $this->assertEmpty($res["data"]["secondary"], "Get secondary: ".json_encode($res));

        /****************************/
        /* Modification des données */
        /****************************/
        // Création d'un utilisateur secondaire pour faire les modifications.
        $this->createUser("UnitTest2", "UnitTest2@citigo.fr","UnitTest2");
        $this->login("UnitTest2", "UnitTest2");


        /*
         *  Changement d'username
         */

        // Fail Case - Username too short
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"pseudo",
            "pseudo"=>"Uni"
        ));

        $this->assertEquals("error", $res["status"], "Username too short : ".json_encode($res));

        // Fail Case - Username already taken
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"pseudo",
            "pseudo"=>"UnitTest"
        ));

        $this->assertEquals("error", $res["status"], "Username already taken : ".json_encode($res));

        // Success Case
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"pseudo",
            "pseudo"=>"UnitTest0"
        ));

        $this->assertEquals("success", $res["status"], "Username OK : ".json_encode($res));
        /*
         *  Changement de password
         */


        // Fail Case - Invalid Password
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"changepassword",
            "current_password"=>"UnitTest2",
            "new_password"=>"1",
            "new_password_verify"=>"1"
        ));

        $this->assertEquals("error", $res["status"], "Invalid Password : ".json_encode($res));

        // Fail Case - Password not matching
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"changepassword",
            "current_password"=>"UnitTest2",
            "new_password"=>"UnitTest1",
            "new_password_verify"=>"UnitTest3"
        ));

        $this->assertEquals("error", $res["status"], "Password not matching: ".json_encode($res));

        // Fail Case - Incorrect Password
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"changepassword",
            "current_password"=>"UnitTest",
            "new_password"=>"UnitTest3",
            "new_password_verify"=>"UnitTest3"
        ));

        $this->assertEquals("error", $res["status"], "Incorrect Password: ".json_encode($res));

        // Success Case
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"changepassword",
            "current_password"=>"UnitTest2",
            "new_password"=>"UnitTest0",
            "new_password_verify"=>"UnitTest0"
        ));

        $this->assertEquals("success", $res["status"], "Correct Password change: ".json_encode($res));


        /*
         *  Ajout d'une addresse secondaire
         */

        // Fail Case - Invalid Mail
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"addmail",
            "mail"=>"UnitTest0.fr"
        ));

        $this->assertEquals("error", $res["status"], "Invalid Mail: ".json_encode($res));

        // Fail Case - Mail already used
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"addmail",
            "mail"=>"UnitTest@citigo.fr"
        ));

        $this->assertEquals("error", $res["status"], "Mail already used: ".json_encode($res));

        // Success Case
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"addmail",
            "mail"=>"UnitTest0@citigo.fr"
        ));

        $this->assertEquals("success", $res["status"], "Mail added: ".json_encode($res));

        $new_id = $res["new_id"];

        // Verification des mails secondaires au get

        $res = $this->api('/ajax/users/account/parameters', Array(
        ));

        $this->assertNotEmpty($res["data"]["secondary"], "Get secondary: ".json_encode($res));

        /*
         *  Echange de l'addresse mail
         */

        // Fail Case - Email non accessible
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"changemail",
            "mid"=>-1
        ));

        $this->assertEquals("error", $res["status"], "Mail non existant: ".json_encode($res));

        // Fail Case - Email not verified
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"changemail",
            "mid"=>$new_id
        ));

        $this->assertEquals("error", $res["status"], "Mail changed: ".json_encode($res));



        //Success Case - TODO il manque une manière de vérifier les mails secondaires (token)
        // Verification du get
        /*$res = $this->api('/ajax/users/account/parameters', Array(
        ));

        $this->assertEquals("UnitTest0@citigo.fr", $res["data"]["email"], "get Email error".json_encode($res));
        $this->assertNotEmpty($res["data"]["secondary"], "Get secondary: ".json_encode($res));*/


        /*
         *  Suppression d'une addresse mail
         */

        // Success Case
        $res = $this->api('/ajax/users/account/parameters/script', Array(
            "source"=>"deletemail",
            "mid"=>$new_id
        ));

        $this->assertEquals("success", $res["status"], "Mail suppressed: ".json_encode($res));

        // Verification du get
        $res = $this->api('/ajax/users/account/parameters', Array(
        ));

        $this->assertEquals("UnitTest2@citigo.fr", $res["data"]["email"], "get Email error".json_encode($res));
        $this->assertEmpty($res["data"]["secondary"], "Get secondary: ".json_encode($res));

        //Suppression de l'utilisateur de test
        $this->deleteUser("UnitTest2@citigo.fr");


    }
}
