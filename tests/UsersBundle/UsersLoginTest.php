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

        $loginCases = [
            Array(),
            Array("login" => $random_key . "testuser@twakeapp.com"),
            Array("password" => "fdsqfsdq", "expected" => false),
            Array("login" => "fdsqfsdq", "expected" => false),
            Array("remindme" => false),
            Array("request" => new Request(Array(), Array(), Array(), Array(), Array(), $_SERVER), "response" => new Response()),
        ];

        foreach ($loginCases as $loginCase) {

            $login = isset($subscribeCase["login"]) ? $subscribeCase["login"] : "testuser";
            $password = isset($subscribeCase["password"]) ? $subscribeCase["password"] : "testuser";
            $remindme = isset($subscribeCase["remindme"]) ? $subscribeCase["remindme"] : true;
            $request = isset($subscribeCase["request"]) ? $subscribeCase["request"] : null;
            $response = isset($subscribeCase["response"]) ? $subscribeCase["response"] : null;

            $expected = isset($subscribeCase["expected"]) ? $subscribeCase["expected"] : true;

            $result = $userService->login($login, $password, $remindme, $request, $response);
            if ($expected) {
                $this->assertInstanceOf(User::class, $result, "Try to login user with good params " . json_encode($loginCase));
            } else {
                $this->assertFalse($result, "Try to login user with bad params " . json_encode($loginCase));
            }

        }

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

    }

}