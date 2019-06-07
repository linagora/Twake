<?php

namespace Tests\UsersBundle;

use Tests\WebTestCaseExtended;

class AliveUserTest extends WebTestCaseExtended
{

    public function testAlive(){

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $alive = $this->get("app.user")->Alive($user->getId());

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        //check date last activity

        $lastActivityUser = $user->getLastActivity();
        $currentDate = date("U");

        $difference = $currentDate - $lastActivityUser;

        $this->assertLessThanOrEqual(10,$difference);



    }

}