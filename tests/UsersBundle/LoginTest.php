<?php

namespace Tests\UsersBundle;

use Tests\WebTestCaseExtended;

class LoginTest extends WebTestCaseExtended

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
}

