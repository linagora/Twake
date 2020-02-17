<?php

namespace Tests\UsersBundle;

require_once __DIR__ . "/../WebTestCaseExtended.php";

use Tests\WebTestCaseExtended;
use Twake\Users\Entity\Device;

class UserLoginTest extends WebTestCaseExtended

//Tests when the user is not connected yet

{

    public function testLoginCorrect()

    {
        $user = $this->newUserByName("usertest001");


        $this->login("usertest001");
        $result = $this->doPost("/ajax/users/current/get", Array());

        $name = $result["data"]["username"];
        $this->assertEquals("usertest001", $name);


    }

    public function testLoginIncorrect()
    {
        $user = $this->newUserByName("usertest001");
        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "wrong email",

        ));

        $result = $this->doPost("/ajax/users/current/get", Array());

        $this->assertEquals("disconnected", $result["errors"]["0"]);
        $this->assertEquals(Array(), $result["data"]);

    }

    public function testEmailCorrect()
    {
        $user = $this->newUserByName("usertest001");

        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001@twake_phpunit.fr",
            "_password" => "usertest001"
        ));


        $result = $this->doPost("/ajax/users/current/get", Array());
        $email = $result["data"]["mails"][0]["email"];
        $this->assertEquals("usertest001@twake_phpunit.fr", $email);
    }

    public function testPasswordIncorrect()
    {
        $user = $this->newUserByName("usertest001");


        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "wrong password"
        ));

        $result = $this->doPost("/ajax/users/current/get", Array());
        $this->assertEquals("disconnected", $result["errors"]["0"]);
        $this->assertEquals(Array(), $result["data"]);;

    }

    public function testBanuser()
    {

        $user = $this->newUserByName("usertest001");

        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $this->assertEquals(false, $user->getBanned());

        $ban = $this->get("app.user")->ban($user->getId());

        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $this->assertEquals(true, $user->getBanned());

        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));
        $this->assertEquals("disconnected", $result["data"]["status"]);


        //test for unban

        $unban = $this->get("app.user")->unban($user->getId());

        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));
        $this->assertEquals("connected", $result["data"]["status"]);

    }

    public function testPassword()
    {
        $user = $this->newUserByName("usertest001");

        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $checkPass = $this->get("app.user")->checkPassword($user->getId(), "usertest001");


        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $this->assertEquals(true, $checkPass);

        $checkPass = $this->get("app.user")->checkPassword($user->getId(), "wrong password");
        $this->assertEquals(false, $checkPass);


    }

    public function testPasswordNoExistingUser()
    {

        $this->removeUserByName("usertest001");

        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $checkPass = $this->get("app.user")->checkPassword("14005200-48b1-11e9-a0b4-0242ac120005", "usertest001");
        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $this->assertEquals(false, $checkPass);

    }

    public function testAvailableMail()
    {

        $this->removeUserByName("usertest001");
        $result = $this->get("app.user")->getAvaibleMailPseudo("usertest001@twake_phpunit.fr", "usertest001");
        $this->assertEquals(true, $result);

        $user = $this->newUserByName("usertest001");
        $result = $this->get("app.user")->getAvaibleMailPseudo("usertest001@twake_phpunit.fr", "usertest001");
        $this->assertGreaterThan(0, count($result));

        $result = $this->get("app.user")->getAvaibleMailPseudo("wrong email", "usertest001");
        $this->assertGreaterThan(0, count($result));
    }

    public function testLogoutCorrect()

    {
        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");


        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));

        $result = $this->doPost("/ajax/users/current/get", Array());

        $name = $result["data"]["username"];
        $this->assertEquals("usertest001", $name);

        $result = $this->doPost("/ajax/users/logout", Array());
        $this->clearClient();

        $result = $this->doPost("/ajax/users/current/get", Array());
        $this->assertEquals(Array(), $result["data"]);
    }

    public function testVerifyMail()
    {

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $result = $this->doPost("/ajax/users/recover/mail", Array(
            "email" => "usertest001@twake_phpunit.fr"
        ));
        $token = $result["data"]["token"];

        $verif = $this->getDoctrine()->getRepository("Twake\Users:VerificationNumberMail")->findOneBy(Array("token" => $token));
        $code = $verif->getcode();
        $this->getDoctrine()->persist($verif);
        $this->getDoctrine()->flush();


        $res = $this->doPost("/ajax/users/subscribe/doverifymail", Array(
            "code" => $code,
            "token" => $token,
            "mail" => "usertest001@twake_phpunit.fr"
        ));


        $verificationRepository = $this->getDoctrine()->getRepository("Twake\Users:VerificationNumberMail");

        $ticket = $verificationRepository->findOneBy(Array("token" => $token));
        $mail = trim(strtolower("usertest001@twake_phpunit.fr"));

        $this->assertEquals(true, $ticket->getVerified());


        $this->assertEquals(true, $user->getMailVerifiedExtended());

        $email = $this->getDoctrine()->getRepository("Twake\Users:Mail")->findOneBy(Array("mail" => "usertest001@twake_phpunit.fr"));
        $email = $email->getMail();
        $this->assertEquals("usertest001@twake_phpunit.fr", $email);


        $workspaceUerByMailRepository = $this->getDoctrine()->getRepository("Twake\Workspaces:WorkspaceUserByMail")->findOneBy(Array("mail" => "usertest001@twake_phpunit.fr"));
        $this->assertEquals(null, $workspaceUerByMailRepository);


        $res = $this->doPost("/ajax/users/subscribe/doverifymail", Array(
            "code" => "ftvg",
            "token" => "bgfsdngfn",
            "mail" => "usertest001@twake_phpunit.fr"
        ));
    }

    public function testAddDevice()
    {


        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));

        $device = Array(
            "type" => "APNS",
            "value" => "AZERTYUIOPQSDFGHJKLMWXCVBN134567890",
            "version" => "1.2.0"

        );


        $existedDevice = $this->getDoctrine()->getRepository("Twake\Users:Device")->findOneBy(Array("value" => "AZERTYUIOPQSDFGHJKLMWXCVBN134567890"));
        if (isset($existedDevice)) {
            $this->getDoctrine()->remove($existedDevice);
            $this->getDoctrine()->flush();
        }


        $res = $this->doPost("/ajax/users/current/get", Array(
            "device" => $device
        ));


        $existedDevice = $this->getDoctrine()->getRepository("Twake\Users:Device")->findOneBy(Array("value" => "AZERTYUIOPQSDFGHJKLMWXCVBN134567890"));
        $existedDeviceValue = $existedDevice->getValue();
        $this->assertEquals("AZERTYUIOPQSDFGHJKLMWXCVBN134567890", $existedDeviceValue);


        $device = Array(
            "type" => "APNS",
            "value" => "AZERTYUIOPQSDFGHJKLMWXCVBN134567890",
            "version" => "1.3.0"

        );

        $res = $this->doPost("/ajax/users/current/get", Array(
            "device" => $device
        ));

        $existedDevice = $this->getDoctrine()->getRepository("Twake\Users:Device")->findOneBy(Array("value" => "AZERTYUIOPQSDFGHJKLMWXCVBN134567890"));
        $existedDeviceValue = $existedDevice->getValue();
        $this->assertEquals("1.3.0", $existedDevice->getVersion());


        $this->removeUserByName("usertest002");
        $user = $this->newUserByName("usertest002");
        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest002"));

        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest002",
            "_password" => "usertest002"
        ));

        $res = $this->doPost("/ajax/users/current/get", Array(
            "device" => $device
        ));

        $existedDevice = $this->getDoctrine()->getRepository("Twake\Users:Device")->findOneBy(Array("value" => "AZERTYUIOPQSDFGHJKLMWXCVBN134567890"));

        $this->assertEquals($user->getId(), $existedDevice->getUserId());

    }

    public function testRemoveDevice()
    {

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest002",
            "_password" => "usertest002"
        ));

        $device_array = Array(
            "type" => "APNS",
            "value" => "AZERTYUIOPQSDFGHJKLMWXCVBN134567890",
            "version" => "1.2.0"
        );


        $device = $this->getDoctrine()->getRepository("Twake\Users:Device")->findOneBy(Array("value" => "AZERTYUIOPQSDFGHJKLMWXCVBN134567890"));
        $deviceValue = $device->getValue();
        $this->assertEquals("AZERTYUIOPQSDFGHJKLMWXCVBN134567890", $deviceValue);

        $res = $this->doPost("/ajax/users/logout", Array(
            "device" => $device_array
        ));

        $device = $this->getDoctrine()->getRepository("Twake\Users:Device")->findOneBy(Array("value" => "AZERTYUIOPQSDFGHJKLMWXCVBN134567890"));
        $this->assertEquals(null, $device);

    }

    public function testAddNewMail()
    {

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));

        $result = $this->doPost("/ajax/users/account/addmail", Array(
            "mail" => "usertest001secondmail@twake_phpunit.fr"
        ));


    }

}