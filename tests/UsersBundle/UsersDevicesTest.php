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
//class UsersDevicesTest extends WebTestCaseExtended
//{
//
//    public function testDevices()
//    {
//        $userService = $this->get("app.user");
//        $random_key = date("U");
//
//        $em = $this->getDoctrine();
//        $repo = $em->getRepository("TwakeUsersBundle:Device");
//
//        $userService->removeUserByUsername("testuser");
//        $userService->subscribeInfo(
//            $random_key . "testuser@twakeapp.com",
//            "testuser",
//            "testuser",
//            "",
//            "",
//            "",
//            null, //Recaptcha
//            "fr", //Language
//            "", //Origin
//            true // force bypass captcha
//        );
//        $user = $userService->login("testuser", "testuser", true);
//
//        $this->doPost("/ajax/users/login", Array(
//            "_username" => "testuser",
//            "_password" => "testuser",
//            "_remember_me" => true,
//            "device" => Array(
//                "type" => "APNS",
//                "value" => "1234567890123456789012345678901234567890_A",
//                "version" => "0.0.0"
//            )
//        ));
//
//        $this->assertEquals(1, count($repo->findBy(Array("user"=>$user))), "Test device number");
//
//        $user_data = $this->doPost("/ajax/users/current/get", Array("device" => Array(
//            "type" => "APNS",
//            "value" => "1234567890123456789012345678901234567890_B",
//            "version" => "0.0.0"
//        )));
//
//        $this->assertEquals(2, count($repo->findBy(Array("user"=>$user))), "Test device number");
//
//        //Logout with unexistant device
//        $this->doPost("/ajax/users/logout", Array("device" => Array(
//            "type" => "APNS",
//            "value" => "1234567890123456789012345678901234567890_C",
//            "version" => "0.0.0"
//        )));
//
//        $this->assertEquals(2, count($repo->findBy(Array("user"=>$user))), "Test device number");
//
//        $this->doPost("/ajax/users/login", Array(
//            "_username" => "testuser",
//            "_password" => "testuser",
//            "_remember_me" => true,
//            "device" => Array(
//                "type" => "APNS",
//                "value" => "1234567890123456789012345678901234567890_A",
//                "version" => "0.0.0"
//            )
//        ));
//
//        $this->assertEquals(2, count($repo->findBy(Array("user"=>$user))), "Test device number");
//
//        //Logout with unexistant device
//        $this->doPost("/ajax/users/logout", Array("device" => Array(
//            "type" => "APNS",
//            "value" => "1234567890123456789012345678901234567890_A",
//            "version" => "0.0.0"
//        )));
//
//        $this->assertEquals(1, count($repo->findBy(Array("user"=>$user))), "Test device number");
//
//
//        //Change user having a key
//        $userService->subscribeInfo(
//            $random_key . "testuser2@twakeapp.com",
//            "testuser2",
//            "testuser2",
//            "",
//            "",
//            "",
//            null, //Recaptcha
//            "fr", //Language
//            "", //Origin
//            true // force bypass captcha
//        );
//        $user2 = $userService->login("testuser2", "testuser2", true);
//
//        $this->doPost("/ajax/users/login", Array(
//            "_username" => "testuser2",
//            "_password" => "testuser2",
//            "device" => Array(
//                "type" => "APNS",
//                "value" => "1234567890123456789012345678901234567890_B",
//                "version" => "0.0.0"
//            )
//        ));
//
//        $this->assertEquals(1, count($repo->findBy(Array("user"=>$user2))), "Test device number");
//        $this->assertEquals(0, count($repo->findBy(Array("user"=>$user))), "Test device number");
//
//        $userService->removeUserByUsername("testuser");
//
//    }
//
//}