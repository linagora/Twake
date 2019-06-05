<?php
//
//namespace Tests\UsersBundle\Controller;
//
//use Tests\WebTestCaseExtended;
//use WebsiteApi\UsersBundle\Entity\User;
//use Symfony\Component\HttpFoundation\Request;
//use Symfony\Component\HttpFoundation\Response;
//
//
//class UsersAccountTest extends WebTestCaseExtended
//{
//
//    public function testAccountPseudoPassword()
//    {
//
//        $userService = $this->get("app.user");
//        $em = $this->getDoctrine();
//
//        $userService->removeUserByUsername("testuser3");
//
//        $userService->removeUserByUsername("testuser");
//        $ers = $userService->subscribeInfo(
//            date("U") . "testuser@twakeapp.com",
//            "testuser",
//            "testuser",
//            "", "", "", null, "fr", "", true
//        );
//
//        $userService->removeUserByUsername("testuser2");
//        $userService->subscribeInfo(
//            date("U") . "testuser2@twakeapp.com",
//            "testuser2",
//            "testuser2",
//            "", "", "", null, "fr", "", true
//        );
//
//        //Test change password and username do not work when not connected
//        $res = $this->doPost("/ajax/users/account/username", Array("username" => ""));
//        $this->assertGreaterThan(0, count($res["errors"]), "Verify we cannot change pseudo if not connected");
//        $res = $this->doPost("/ajax/users/account/password", Array("old_password" => "", "password" => ""));
//        $this->assertGreaterThan(0, count($res["errors"]), "Verify we cannot change password if not connected");
//
//        $em->clear();
//
//        $user = $userService->login("testuser", "testuser", true);
//        $this->doPost("/ajax/users/login", Array("_username" => "testuser", "_password" => "testuser"));
//
//        //Pseudo
//
//        $res = $this->doPost("/ajax/users/account/username", Array("username" => ""));
//        $this->assertGreaterThan(0, count($res["errors"]), "Verify we cannot change to empty pseudo");
//
//        $em->clear();
//
//        $res = $this->doPost("/ajax/users/account/username", Array("username" => "testuser2"));
//        $this->assertGreaterThan(0, count($res["errors"]),"Verify we cannot change to already used pseudo");
//
//        $em->clear();
//
//        $res = $userService->changePseudo(-1, "testuserfsqf");
//        $this->assertFalse($res, "Verify no error when we use bad user id on pseudo change");
//
//        $em->clear();
//
//        $res = $this->doPost("/ajax/users/account/username", Array("username" => "testuser3"));
//        $this->assertEquals(0, count($res["errors"]), "Verify can choose a new pseudo");
//
//        $em->clear();
//
//        $user = $userService->login("testuser3", "testuser", true);
//        $this->assertInstanceOf(User::class, $user, "Verify pseudo was changed 1");
//        $this->assertEquals($user->getUsername(), "testuser3", "Verify pseudo was changed 2");
//        $userService->changePseudo($user->getId(), "testuser");
//
//
//        //Password
//
//        $res = $this->doPost("/ajax/users/account/password", Array("old_password" => "testuser"));
//        $this->assertGreaterThan(0, count($res["errors"]), "Verify we cannot change to empty password");
//
//        $em->clear();
//
//        $res = $userService->changePassword(-1, "testuser", "");
//        $this->assertFalse($res, "Verify no error when we use bad user id on password change");
//
//        $em->clear();
//
//        $res = $this->doPost("/ajax/users/account/password", Array("old_password" => "testuser", "password" => "1234567"));
//        $this->assertGreaterThan(0, count($res["errors"]), "Verify we cannot change to too short password");
//
//        $em->clear();
//
//        $res = $this->doPost("/ajax/users/account/password", Array("old_password" => "12341234", "password" => "new_password"));
//        $this->assertGreaterThan(0, count($res["errors"]), "Verify we cannot change password with bad old password");
//
//        $em->clear();
//
//        $res = $this->doPost("/ajax/users/account/password", Array("old_password" => "testuser", "password" => "new_password"));
//        $this->assertEquals(0, count($res["errors"]), "Verify we can change password");
//
//        $em->clear();
//
//        $user = $userService->login("testuser", "new_password", true);
//        $this->assertInstanceOf(User::class, $user, "Verify password was changed");
//        $userService->changePassword($user->getId(), "new_password", "testuser");
//
//
//        $userService->removeUserByUsername("testuser");
//        $userService->removeUserByUsername("testuser2");
//
//    }
//
//    public function testAccountLanguage()
//    {
//
//        $userService = $this->get("app.user");
//
//        $userService->removeUserByUsername("testuser");
//        $userService->subscribeInfo(
//            date("U") . "testuser@twakeapp.com",
//            "testuser",
//            "testuser",
//            "", "", "", null, "fr", "", true
//        );
//
//        //Test when not connected
//        $res = $this->doPost("/ajax/users/account/language", Array("language" => "fr"));
//        $this->assertGreaterThan(0, count($res["errors"]), "Verify we cannot change language if not connected");
//
//        $user = $userService->login("testuser", "testuser", true);
//        $this->doPost("/ajax/users/login", Array("_username" => "testuser", "_password" => "testuser"));
//
//        $em = $this->getDoctrine();
//        $repo = $em->getRepository("TwakeUsersBundle:User");
//
//        $this->doPost("/ajax/users/account/language", Array("language" => "en"));
//        $this->assertEquals(200, $this->getClient()->getResponse()->getStatusCode(), "Test change language option");
//        $user = $repo->find($user->getId());
//        $this->assertEquals("en", $user->getLanguage(), "Test change language worked");
//
//        $em->clear();
//
//        $this->doPost("/ajax/users/account/language", Array("language" => "de"));
//        $this->assertEquals(200, $this->getClient()->getResponse()->getStatusCode(), "Test change language option");
//        $user = $repo->find($user->getId());
//        $this->assertEquals("de", $user->getLanguage(), "Test change language worked");
//
//    }
//
//}