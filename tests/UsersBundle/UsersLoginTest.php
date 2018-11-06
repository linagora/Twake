<?php

namespace Tests\UsersBundle\Controller;

use Tests\WebTestCaseExtended;
use WebsiteApi\UsersBundle\Entity\User;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;


class UsersLoginTest extends WebTestCaseExtended
{

    public function testSubscribe()
    {

        $userService = $this->get("app.user");

        $userService->removeUserByUsername("testuser");
        $userService->removeUserByUsername("unittest1");
        $userService->removeUserByUsername("unittest2");

        $subscribeCases = [
            Array(), //Default values
            Array("username" => "", "expected" => false),
            Array("password" => "", "expected" => false),
            Array("mail" => "", "expected" => false),
            Array("mail" => "test", "expected" => false),
            Array("mail" => "@test", "expected" => false),
            Array("mail" => "test@test", "expected" => false),
            Array("mail" => "test@test.fr", "expected" => true),
            Array("phone" => "", "expected" => true),
            Array("firstname" => "", "expected" => true),
            Array("lastname" => "", "expected" => true),
            Array("language" => "en", "expected" => true),
            Array("language" => "it", "expected" => true),
            Array("language" => "de", "expected" => true),

            Array("mail" => "unittest1@twakeapp.com", "remove" => false),
            Array("mail" => "unittest2@twakeapp.com", "expected" => false), //Duplicata for username

            Array("username" => "unittest1", "remove" => false),
            Array("username" => "unittest2", "expected" => false), //Duplicata for emails
            Array("username" => "unittest1", "expected" => false), //To remive unremoved unittest1

        ];

        foreach ($subscribeCases as $subscribeCase) {

            $username = isset($subscribeCase["username"]) ? $subscribeCase["username"] : "testuser";
            $password = isset($subscribeCase["password"]) ? $subscribeCase["password"] : "password";
            $firstname = isset($subscribeCase["firstname"]) ? $subscribeCase["firstname"] : "firstname";
            $lastname = isset($subscribeCase["lastname"]) ? $subscribeCase["lastname"] : "lastname";
            $phone = isset($subscribeCase["phone"]) ? $subscribeCase["phone"] : "";
            $language = isset($subscribeCase["language"]) ? $subscribeCase["language"] : "fr";
            $mail = isset($subscribeCase["mail"]) ? $subscribeCase["mail"] : "testuser@twakeapp.com";

            $expected = isset($subscribeCase["expected"]) ? $subscribeCase["expected"] : true;
            $remove = isset($subscribeCase["remove"]) ? $subscribeCase["remove"] : true;

            $result = $userService->subscribeInfo(
                $mail,
                $password,
                $username,
                $firstname,
                $lastname,
                $phone,
                null, //Recaptcha
                $language, //Language
                "", //Origin
                true // force bypass captcha
            );

            $this->assertEquals($expected, $result, "Try to create user with special params : " . json_encode($subscribeCase));

            if ($remove) {
                $userService->removeUserByUsername($username);
            }

        }

    }


    public function testLogin()
    {
        $userService = $this->get("app.user");
        $random_key = date("U");

        $userService->removeUserByUsername("testuser");
        $userService->subscribeInfo(
            $random_key . "testuser@twakeapp.com",
            "testuser",
            "testuser",
            "",
            "",
            "",
            null, //Recaptcha
            "fr", //Language
            "", //Origin
            true // force bypass captcha
        );
        $user = $userService->login("testuser", "testuser", true);

        $loginCases = [
            Array(),
            Array("login" => $random_key . "testuser@twakeapp.com"),
            Array("password" => "fdsqfsdq", "expected" => false),
            Array("login" => "fdsqfsdq", "expected" => false),
            Array("remindme" => false),
            Array("device" => Array(
                "type" => "APNS",
                "value" => "1234567890",
                "version" => "0.0.0"
            )),
            Array("device" => Array(
                "value" => "1234567890",
                "version" => "0.0.0"
            )),
            Array("device" => Array(
                "type" => "APNS",
                "version" => "0.0.0"
            )),
            Array("device" => Array(
                "type" => "APNS",
                "value" => "1234567890",
            )),
            Array("device" => Array(
                "type" => "DSQKLMMQ",
                "value" => "1234567890",
                "version" => "0.0.0"
            )),
            Array("device" => Array(
                "type" => "DSQKLMMQ",
                "value" => "",
                "version" => "0.0.0"
            ))
        ];

        foreach ($loginCases as $loginCase) {

            $login = isset($loginCase["login"]) ? $loginCase["login"] : "testuser";
            $password = isset($loginCase["password"]) ? $loginCase["password"] : "testuser";
            $remindme = isset($loginCase["remindme"]) ? $loginCase["remindme"] : true;
            $device = isset($loginCase["device"]) ? $loginCase["device"] : null;

            $expected = isset($loginCase["expected"]) ? $loginCase["expected"] : true;

            $result = $this->doPost("/ajax/users/login", Array(
                "_username" => $login,
                "_password" => $password,
                "_remember_me" => $remindme,
                "device" => $device
            ));

            if ($expected) {
                $this->assertEquals("connected", $result["data"]["status"], "Try to login user with good params " . json_encode($loginCase));

                $resultPasswordCheck = $userService->checkPassword($user->getId(), $password);
                $this->assertTrue($resultPasswordCheck, "Test checkPassword method is true as login worked");

            } else {

                $test_user_exists = $userService->loginWithUsernameOnly($login);
                if ($test_user_exists) {
                    $resultPasswordCheck = $userService->checkPassword($test_user_exists->getId(), $password);
                    $this->assertFalse($resultPasswordCheck, "Test checkPassword method is false as login did not worked but user exists");
                }

                $this->assertEquals("disconnected", $result["data"]["status"], "Try to login user with bad params " . json_encode($loginCase));
            }

        }

        $resultPasswordCheck = $userService->checkPassword(-1, "AZERTYUIOP");
        $this->assertFalse($resultPasswordCheck, "Test checkPassword method is false when user does not exists");


        //Test login, current, alive then logout

        $this->doPost("/ajax/users/login", Array(
            "_username" => "testuser",
            "_password" => "testuser",
            "_remember_me" => true
        ));

        $user_data = $this->doPost("/ajax/users/current/get");
        $this->assertEquals("testuser", $user_data["data"]["username"], "Test current user data");
        $this->assertGreaterThan(0, $user_data["data"]["privateworkspace"]["id"], "Test current user has private workspace");

        $alive = $this->doPost("/ajax/users/alive");
        $this->assertEquals("ok", $alive["data"], "Test alive return response");

        $this->doPost("/ajax/users/logout");

        $userService->removeUserByUsername("testuser");

    }


    public function testBan()
    {
        $userService = $this->get("app.user");

        $userService->removeUserByUsername("testuser");
        $userService->subscribeInfo(
            date("U") . "testuser@twakeapp.com",
            "testuser",
            "testuser",
            "",
            "",
            "",
            null, //Recaptcha
            "fr", //Language
            "", //Origin
            true // force bypass captcha
        );

        $this->get("request_stack")->push(new Request(Array(), Array(), Array(), Array(), Array(), $_SERVER));

        $user = $userService->login("testuser", "testuser", true);
        $this->assertInstanceOf(User::class, $user, "Test non banned user can login");

        $user_id = $user->getId();

        $userService->ban($user_id);

        $user = $userService->login("testuser", "testuser", true);
        $this->assertFalse($user, "Test banned user cannot login");

        $user = $userService->loginWithUsernameOnly("testuser");
        $this->assertFalse($user, "Test banned user cannot login either with loginWithUsernameOnly");

        $userService->unban($user_id);

        $user = $userService->login("testuser", "testuser", true);
        $this->assertInstanceOf(User::class, $user, "Test non banned user can login again after being banned");

        $user = $userService->loginWithUsernameOnly("testuser");
        $this->assertInstanceOf(User::class, $user, "Test non banned user can login again either with loginWithUsernameOnly");

        //Test is new
        $this->doPost("/ajax/users/set/isNew", Array("value" => false));
        $this->assertEquals(200, $this->getClient()->getResponse()->getStatusCode(), "Test set is new to false");
        $this->doPost("/ajax/users/set/isNew", Array("value" => true));
        $this->assertEquals(200, $this->getClient()->getResponse()->getStatusCode(), "Test set is new to true");

        //Autologin no 500 error test
        $this->doPost("/ajax/users/autoLogin", Array());
        $this->assertEquals(302, $this->getClient()->getResponse()->getStatusCode(), "Test autologin works");

        //Autologin no 500 error test
        $this->doGet("/ajax/users/mobile_redirect");
        $this->assertEquals(200, $this->getClient()->getResponse()->getStatusCode(), "Test mobile_redirect works");

        //Autologin no 500 error test
        $this->doPost("/ajax/users/isLogged", Array());
        $this->assertEquals(200, $this->getClient()->getResponse()->getStatusCode(), "Test isLogged works");

        $userService->removeUserByUsername("testuser");

    }

}