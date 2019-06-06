<?php

namespace Tests\UsersBundle;

use Tests\WebTestCaseExtended;

class BanUserTest extends WebTestCaseExtended
{

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

}