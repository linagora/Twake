<?php

namespace Tests\WebsiteApi\Controller;

use Tests\WebTestCaseExtended;

class UserContactTest extends WebTestCaseExtended
{
    public function testIndex(){

        // GetRelation will be tested for each other functionality in these Tests
        //Create second user to add to contacts (called account B) and third user (called account C)

        $repoUser = $this->getDoctrine()->getRepository("TwakeUsersBundle:User");
        $idA = $repoUser->findOneBy(Array("username"=>"UnitTest"))->getId();

        $this->createUser("UnitTest2","UnitTest2@citigo.fr", "UnitTest2");
        $idB = $repoUser->findOneBy(Array("username"=>"UnitTest2"))->getId();

        $this->createUser("UnitTest3","UnitTest3@citigo.fr", "UnitTest3");
        $idC = $repoUser->findOneBy(Array("username"=>"UnitTest3"))->getId();

        //login to account A
        $this->login();
        /***************/
        /* GetRelation */
        /***************/

        // Fail Case - yourself
        $res = $this->api('/ajax/users/account/contacts/user', Array(
            "user_id"=>$idA
        ));

        $this->assertEquals("error", $res["status"], "Verify yourself : ".json_encode($res));
        $this->assertEquals("cant_friend_yourself", $res["errors"][0], "Verify yourself : ".json_encode($res));
        /*****************/
        /* Demande d'ami */
        /*****************/

        // Fail Case - Ask yourself

        $res = $this->api('/ajax/users/account/contacts/ask', Array(
            "user_id"=>$idA
        ));

        $this->assertEquals("error", $res["status"], "Ask yourself : ".json_encode($res));

        // Fail Case - Ask someone that doesn't exists

        $res = $this->api('/ajax/users/account/contacts/ask', Array(
            "user_id"=>-1
        ));

        $this->assertEquals("error", $res["status"], "Account doesn't exist : ".json_encode($res));

        // Success Case

        $res = $this->api('/ajax/users/account/contacts/ask', Array(
            "user_id"=>$idB
        ));

        $this->assertEquals("success", $res["status"], "Ask to friend : ".json_encode($res));

        //For later refusal
        $res = $this->api('/ajax/users/account/contacts/ask', Array(
            "user_id"=>$idC
        ));
        // getRelation verification

        $res = $this->api('/ajax/users/account/contacts/user', Array(
            "user_id"=>$idB
        ));

        $this->assertEquals("success", $res["status"], "Verify ask : ".json_encode($res));
        $this->assertEquals("cancel", $res["result"], "Verify ask : ".json_encode($res));

        /***********************************/
        /* Acceptation d'une demande d'ami */
        /***********************************/

        $this->login("UnitTest2","UnitTest2");
        // getRelation Verification

        $res = $this->api('/ajax/users/account/contacts/user', Array(
            "user_id"=>$idA
        ));

        $this->assertEquals("success", $res["status"], "Verify asked : ".json_encode($res));
        $this->assertEquals("accept", $res["result"], "Verify asked : ".json_encode($res));


        //Fail Case - no invitation to friend
        $res = $this->api('/ajax/users/account/contacts/accept', Array(
            "user_id"=>$idC
        ));
        $this->assertEquals("error", $res["status"], "accept not asked : ".json_encode($res));

        // Success Case
        $res = $this->api('/ajax/users/account/contacts/accept', Array(
            "user_id"=>$idA
        ));
        $this->assertEquals("success", $res["status"], "accept asked : ".json_encode($res));

        // Verify getRelation

        $res = $this->api('/ajax/users/account/contacts/user', Array(
            "user_id"=>$idA
        ));

        $this->assertEquals("success", $res["status"], "Verify asked : ".json_encode($res));
        $this->assertEquals("remove", $res["result"], "Verify asked : ".json_encode($res));

        /************************/
        /* Suppression d'un ami */
        /************************/

        //Fail Case - no invitation to friend
	    $res = $this->api('/ajax/users/account/contacts/remove', Array(
            "user_id"=>$idA
        ));
        $this->assertEquals("success", $res["status"], "removed user: ".json_encode($res));

        // Verify getRelation

        $res = $this->api('/ajax/users/account/contacts/user', Array(
            "user_id"=>$idA
        ));

        $this->assertEquals("success", $res["status"], "Verify asked : ".json_encode($res));
        $this->assertEquals("canask", $res["result"], "Verify asked : ".json_encode($res));

        /*************************/
        /* Refuse une invitation */
        /*************************/

        $this->login("UnitTest3","UnitTest3");
        $res = $this->api('/ajax/users/account/contacts/refuse', Array(
            "user_id"=>$idA
        ));
        $this->assertEquals("success", $res["status"], "refused user: ".json_encode($res));

        // Verify getRelation

        $res = $this->api('/ajax/users/account/contacts/user', Array(
            "user_id"=>$idA
        ));

        $this->assertEquals("success", $res["status"], "Verify refused : ".json_encode($res));
        $this->assertEquals("canask", $res["result"], "Verify refused : ".json_encode($res));

        /*************************/
        /* Cancel une invitation */
        /*************************/

	        $res = $this->api('/ajax/users/account/contacts/ask', Array(
            "user_id"=>$idA
        ));

        $res = $this->api('/ajax/users/account/contacts/remove', Array(
            "user_id"=>$idA
        ));

        // Verify getRelation

        $res = $this->api('/ajax/users/account/contacts/user', Array(
            "user_id"=>$idA
        ));

        $this->assertEquals("success", $res["status"], "Verify refused : ".json_encode($res));
        $this->assertEquals("canask", $res["result"], "Verify refused : ".json_encode($res));


        // Deletion des users ajoutés
        $this->login();
        $this->deleteUser("UnitTest2@citigo.fr");
        $this->deleteUser("UnitTest3@citigo.fr");



    }


}
