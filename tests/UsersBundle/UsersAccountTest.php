<?php

namespace Tests\UsersBundle\Controller;

use Tests\WebTestCaseExtended;
use WebsiteApi\UsersBundle\Entity\User;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;


class UsersAccountTest extends WebTestCaseExtended
{

    public function testAccountPseudoPassword()
    {

        $userService = $this->get("app.user");

        $userService->removeUserByUsername("testuser3");

        $userService->removeUserByUsername("testuser");
        $ers = $userService->subscribeInfo(
            date("U") . "testuser@twakeapp.com",
            "testuser",
            "testuser",
            "", "", "", null, "fr", "", true
        );

        $userService->removeUserByUsername("testuser2");
        $userService->subscribeInfo(
            date("U") . "testuser2@twakeapp.com",
            "testuser2",
            "testuser2",
            "", "", "", null, "fr", "", true
        );

        $user = $userService->login("testuser", "testuser", true);

        //Pseudo

        $res = $userService->changePseudo($user->getId(), "");
        $this->assertFalse($res, "Verify we cannot change to empty pseudo");

        $res = $userService->changePseudo($user->getId(), "testuser2");
        $this->assertFalse($res, "Verify we cannot change to already used pseudo");

        $res = $userService->changePseudo($user->getId(), "testuser3");
        $this->assertTrue($res, "Verify can choose a new pseudo");

        $user = $userService->login("testuser3", "testuser", true);
        $this->assertInstanceOf(User::class, $user, "Verify pseudo was changed 1");
        $this->assertEquals($user->getUsername(), "testuser3", "Verify pseudo was changed 2");
        $userService->changePseudo($user->getId(), "testuser");


        //Password

        $res = $userService->changePassword($user->getId(), "testuser", "");
        $this->assertFalse($res, "Verify we cannot change to empty password");

        $res = $userService->changePassword($user->getId(), "testuser", "1234567");
        $this->assertFalse($res, "Verify we cannot change to too short password");

        $res = $userService->changePassword($user->getId(), "12341234", "new_password");
        $this->assertFalse($res, "Verify we cannot change password with bad old password");

        $res = $userService->changePassword($user->getId(), "testuser", "new_password");
        $this->assertTrue($res, "Verify we can change password");

        $user = $userService->login("testuser", "new_password", true);
        $this->assertInstanceOf(User::class, $user, "Verify password was changed");
        $userService->changePassword($user->getId(), "new_password", "testuser");


        $userService->removeUserByUsername("testuser");
        $userService->removeUserByUsername("testuser2");

    }

}