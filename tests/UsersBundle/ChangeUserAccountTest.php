<?php

namespace Tests;

use Tests\WebTestCaseExtended;

class ChangeUserAccountTest extends WebTestCaseExtended
{

    public function testChangePassword()

    {
        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->changePassword($user->getId(), "usertest001", "newPassword");
        $this->assertEquals(true,$result);

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->checkPassword($user->getId(), "newPassword");
        $this->assertEquals(true,$result);

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->changePassword($user->getId(), "usertest001", "3");
        $this->assertEquals(false,$result);

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->checkPassword($user->getId(), "newPassword");
        $this->assertEquals(true,$result);

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->changePassword($user->getId(), "usertest001", null);
        $this->assertEquals(false,$result);

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->checkPassword($user->getId(), "newPassword");
        $this->assertEquals(true,$result);

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->changePassword("14005200-48b1-11e9-a0b4-0242ac120005", "usertest001", "newpasswordbis");
        $this->assertEquals(false,$result);

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->checkPassword($user->getId(), "newPassword");
        $this->assertEquals(true,$result);



    }

    public function testChangePseudo()

    {
//        $this->removeUserByName("usertest001");
//        $user = $this->newUserByName("usertest001");

//        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
//        $result = $this->get("app.user")->changePseudo($user->getId(), "newpseudo");
//        $this->assertEquals(true,$result);
//        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "newpseudo"));
//        $this->assertEquals("newpseudo", $user->getUsername());



//        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
//        $result = $this->get("app.user")->changePseudo($user->getId(), "3");
//        $this->assertEquals(false,$result);
//
//        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
//        $result = $this->get("app.user")->changeseudo($user->getId(), null);
//        $this->assertEquals(false,$result);
//
//
//        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
//        $result = $this->get("app.user")->changePseudo("14005200-48b1-11e9-a0b4-0242ac120005", "newPseudoBis");
//        $this->assertEquals(false,$result);




    }
}