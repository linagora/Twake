<?php

namespace Tests\WebsiteApi\Controller;

use Tests\WebTestCaseExtended;

class AAAUsersRegistrationLoginLogoutTest extends WebTestCaseExtended
{

    public function testIndex()
    {
        /**********************************/
        /* Création d'un compte - Etape 1 */
        /**********************************/

        // Fail Case - Username Too Short
        $res = $this->api('/ajax/users/register/check', Array(
            "_username"=>"Uni",
            "_mail"=>"UnitTest@citigo.fr"
        ));

        $this->assertEquals("error", $res["status"], "Username too short : ".json_encode($res));

        // Fail Case - Username Too Long
        $res = $this->api('/ajax/users/register/check', Array(
            "_username"=> str_repeat("a",31),
            "_mail"=>"UnitTest@citigo.fr"
        ));

        $this->assertEquals("error", $res["status"], "Username too long : ".json_encode($res));

        // Fail Case - Invalid Mail
        $res = $this->api('/ajax/users/register/check', Array(
            "_username"=> "UnitTest2",
            "_mail"=>"UnitTestcitigo.fr"
        ));

        $this->assertEquals("error", $res["status"], "Invalid mail : ".json_encode($res));

        // Fail Case - Invalid Mail 2
        $res = $this->api('/ajax/users/register/check', Array(
            "_username"=> "UnitTest2",
            "_mail"=>"ésoef@citigo.fr"
        ));

        $this->assertEquals("error", $res["status"], "Invalid mail 2: ".json_encode($res));

        // Success Case
        $res = $this->api('/ajax/users/register/check', Array(
            "_username"=>"UnitTest",
            "_mail"=>"UnitTest@citigo.fr"
        ));


        $this->assertEquals("success", $res["status"], "Account creation should have worked : ".json_encode($res));

        // Fail Case - Username already taken
        $res = $this->api('/ajax/users/register/check', Array(
            "_username"=> "UnitTest",
            "_mail"=>"UnitTest1@citigo.fr"
        ));

        $this->assertEquals("error", $res["status"], "Duplicate username: ".json_encode($res));

        // Fail Case - Clean username already taken
        $res = $this->api('/ajax/users/register/check', Array(
            "_username"=> "U nI tT eSt",
            "_mail"=>"UnitTest1@citigo.fr"
        ));

        $this->assertEquals("error", $res["status"], "Duplicate clean username: ".json_encode($res));

        // Fail Case - Email already taken
        $res = $this->api('/ajax/users/register/check', Array(
            "_username"=> "UnitTest1",
            "_mail"=>"UnitTest@citigo.fr"
        ));

        $this->assertEquals("error", $res["status"], "Duplicate email: ".json_encode($res));

        /**********************************/
        /* Création d'un compte - Etape 2 */
        /**********************************/

        // Fail Case - bad token
        $token = "a";
        $res = $this->api('/ajax/users/register/confirm/'.$token, Array(
            "token"=>$token
        ));

        $this->assertTrue(in_array("nosuchtoken",$res["errors"]), "This token doesn't exists : ".json_encode($res));

        // Success Case
        $repoUser = $this->getDoctrine()->getRepository("TwakeUsersBundle:User");
        $token = $repoUser->findOneBy(Array("username"=>"UnitTest"))->getConfirmationToken();
        $res = $this->api('/ajax/users/register/confirm/'.$token, Array(
            "token"=>$token
        ));

        $this->assertEquals("UnitTest", $res["data"]["username"], "Token verification should have worked : ".json_encode($res));

        /**********************************/
        /* Création d'un compte - Etape 3 */
        /**********************************/

        // Fail Case - Username too short
        $res = $this->api('/ajax/users/register/end/validate', Array(
            "username"=>"Uni",
            "password"=>"UnitTest1",
            "verify"=>"UnitTest1",
            "token"=>$token
        ));

        $this->assertEquals("error", $res["status"], "Username too short : ".json_encode($res));

        // Fail Case - Password too short
        $res = $this->api('/ajax/users/register/end/validate', Array(
            "username"=>"UnitTest",
            "password"=>"UnitTe1",
            "verify"=>"UnitTe1",
            "token"=>$token
        ));

        $this->assertEquals("error", $res["status"], "Password too short : ".json_encode($res));

        // Fail Case - Password not safe - no number
        $res = $this->api('/ajax/users/register/end/validate', Array(
            "username"=>"UnitTest",
            "password"=>"UnitTest",
            "verify"=>"UnitTest",
            "token"=>$token
        ));

        $this->assertEquals("error", $res["status"], "Password doesn't have number : ".json_encode($res));

        // Fail Case - Password not safe - no minuscule
        $res = $this->api('/ajax/users/register/end/validate', Array(
            "username"=>"UnitTest",
            "password"=>"UNITTEST1",
            "verify"=>"UNITTEST1",
            "token"=>$token
        ));

        $this->assertEquals("error", $res["status"], "Password doesn't have minuscule : ".json_encode($res));

        // Fail Case - Password not safe - no majuscule
        $res = $this->api('/ajax/users/register/end/validate', Array(
            "username"=>"UnitTest",
            "password"=>"unittest1",
            "verify"=>"unittest1",
            "token"=>$token
        ));

        $this->assertEquals("error", $res["status"], "Password doesn't have majuscule : ".json_encode($res));

        // Fail Case - Passwords not matching
        $res = $this->api('/ajax/users/register/end/validate', Array(
            "username"=>"UnitTest",
            "password"=>"UnitTest1",
            "verify"=>"UnitTest2",
            "token"=>$token
        ));

        $this->assertEquals("error", $res["status"], "Passwords doesn't match : ".json_encode($res));


        // Success Case
        $res = $this->api('/ajax/users/register/end/validate', Array(
            "username"=>"UnitTest",
            "password"=>"UnitTest1",
            "verify"=>"UnitTest1",
            "token"=>$token
        ));

        $this->assertEquals("success", $res["status"], "Account finalization should have worked : ".json_encode($res));

        /*******************************************************************************************/
        /* Vérification de la fonction de Création et de Délétion de compte de WebTestCaseExtended */
        /*******************************************************************************************/

        $this->assertEquals("success", $this->createUser("UnitTest2","UnitTest2@citigo.fr", "UnitTest2"), "La fonction de creation de compte a echouee");

        $this->assertEquals("success", $this->deleteUser("UnitTest2@citigo.fr"), "La fonction de suppression de compte a echouee");

        /*************************/
        /* Vérification du login */
        /*************************/

        // Error Case - Bad Password
        $res = $this->api('/ajax/users/login', Array(
            "_username"=>"UnitTest",
            "_password"=>"Unit"

        ));


        $this->assertEquals($res["status"], "error", "Bad password :".json_encode($res));

        // Error Case - Account doesn't exists
        $res = $this->api('/ajax/users/login', Array(
            "_username"=>"Uni",
            "_password"=>"Uni"

        ));


        $this->assertEquals($res["status"], "error", "Account doesn't exist :".json_encode($res));


        // Success Case
        $res = $this->api('/ajax/users/login', Array(
            "_username"=>"UnitTest",
            "_password"=>"UnitTest1"
        ));

        $this->assertEquals($res["status"], "success", "Login should have worked :".json_encode($res));

        // Success Case - Connected
        $res = $this->api("/ajax/users/current/get", Array());
        $this->assertEquals($res["data"]["status"], "connected", "This user is connected :".json_encode($res));


        /**************************/
        /* Vérification du logout */
        /**************************/

        // Success Case - Logout
        $res = $this->api("/ajax/users/logout", Array());
        $this->assertEquals($res["status"], "success", "Logout CAN NOT return error, this is most likely an error 500 :".json_encode($res));


        // Success Case - Not connected
        $this->logout();
        $res = $this->api("/ajax/users/current/get", Array());
        $this->assertEquals($res["data"]["status"], "notconnected", "This user is not connected :".json_encode($res));


    }
}
