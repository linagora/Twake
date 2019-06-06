<?php

namespace Tests;

use Tests\WebTestCaseExtended;

class Logout extends WebTestCaseExtended
{

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