<?php

namespace Tests\UsersBundle;

use Tests\WebTestCaseExtended;

class CheckPasswordTest extends WebTestCaseExtended
{


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

}