<?php

namespace Tests\UsersBundle;

use Tests\WebTestCaseExtended;

class UserLoginTest extends WebTestCaseExtended

//Tests when the user is not connected yet

{

    public function testLoginCorrect()

    {

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");


        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));

        $result = $this->doPost("/ajax/users/current/get", Array());

        $name = json_decode($result->getContent(),true)["data"]["username"];
        $this->assertEquals("usertest001", $name);



    }

    public function testLoginIncorrect()
    {
        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");


        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "wrong email",

        ));

        $result = $this->doPost("/ajax/users/current/get", Array());

        $this->assertEquals("disconnected", json_decode($result->getContent(),true)["errors"]["0"] );
        $this->assertEquals(Array(), json_decode($result->getContent(), true)["data"]);

    }

    public function testEmailCorrect()
    {
        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");


        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001@twake_phpunit.fr",
            "_password" => "usertest001"
        ));


        $result = $this->doPost("/ajax/users/current/get", Array());
        $email = json_decode($result->getContent(),true)["data"]["mails"][0]["email"];
        $this->assertEquals("usertest001@twake_phpunit.fr", $email);
    }

    public function testPasswordIncorrect()
    {
        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");


        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "wrong password"
        ));

        $result = $this->doPost("/ajax/users/current/get", Array());
        $this->assertEquals("disconnected", json_decode($result->getContent(),true)["errors"]["0"] );
        $this->assertEquals(Array(), json_decode($result->getContent(), true)["data"]);;

    }

    public function testBanuser(){


        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $this->assertEquals(false, $user->getBanned());

        $ban = $this->get("app.user")->ban($user->getId());

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $this->assertEquals(true, $user->getBanned());

        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));
        $this->assertEquals("disconnected", json_decode($result->getContent(),true)["data"]["status"] );


        //test for unban

        $unban = $this->get("app.user")->unban($user->getId());

        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));
        $this->assertEquals("connected", json_decode($result->getContent(),true)["data"]["status"] );

    }

    public function testPassword(){


        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");


        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $checkPass =  $this->get("app.user")->checkPassword($user->getId(), "usertest001");


        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $this->assertEquals(true, $checkPass);

        $checkPass =  $this->get("app.user")->checkPassword($user->getId(), "wrong password");
        $this->assertEquals(false, $checkPass);


    }

    public function testPasswordNoExistingUser(){

        $this->removeUserByName("usertest001");

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $checkPass =  $this->get("app.user")->checkPassword("14005200-48b1-11e9-a0b4-0242ac120005", "usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $this->assertEquals(false, $checkPass);

    }

    public function testAvailableMail(){

        $this->removeUserByName("usertest001");
        $result = $this->get("app.user")->getAvaibleMailPseudo("usertest001@twake_phpunit.fr","usertest001");
        $this->assertEquals(true,$result);

        $user = $this->newUserByName("usertest001");
        $result = $this->get("app.user")->getAvaibleMailPseudo("usertest001@twake_phpunit.fr","usertest001");
        $this->assertGreaterThan(0,count($result));

        $result = $this->get("app.user")->getAvaibleMailPseudo("wrong email","usertest001");
        $this->assertGreaterThan(0,count($result));
    }

    public function testLogoutCorrect()

    {
        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");


        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));

        $result = $this->doPost("/ajax/users/current/get", Array());

        $name = json_decode($result->getContent(),true)["data"]["username"];
        $this->assertEquals("usertest001", $name);

        $result = $this->doPost("/ajax/users/logout", Array(
        ));
        $this->clearClient();

        $result = $this->doPost("/ajax/users/current/get", Array());
        $this->assertEquals(Array(), json_decode($result->getContent(),true)["data"] );
    }
}