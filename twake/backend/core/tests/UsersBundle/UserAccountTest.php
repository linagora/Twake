<?php

namespace Tests\UsersBundle;

require_once __DIR__ . "/../WebTestCaseExtended.php";

use Tests\WebTestCaseExtended;
use Twake\Users\Entity\Mail;

class UserAccountTest extends WebTestCaseExtended

//Tests when the user is already connected

{

    public function testAlive()
    {

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");

        $alive = $this->get("app.user")->Alive($user->getId());


        $lastActivityUser = $user->getLastActivity();
        $currentDate = date("U");

        $difference = $currentDate - $lastActivityUser;

        $this->assertLessThanOrEqual(10, $difference);

    }

    public function testChangePassword()

    {

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");

        $result = $this->get("app.user")->changePassword($user->getId(), "usertest001", "newPassword");
        $this->assertEquals(true, $result);

        $result = $this->get("app.user")->checkPassword($user->getId(), "newPassword");
        $this->assertEquals(true, $result);

        $result = $this->get("app.user")->changePassword($user->getId(), "usertest001", "3");
        $this->assertEquals(false, $result);

        $result = $this->get("app.user")->checkPassword($user->getId(), "newPassword");
        $this->assertEquals(true, $result);

        $result = $this->get("app.user")->changePassword($user->getId(), "usertest001", null);
        $this->assertEquals(false, $result);

        $result = $this->get("app.user")->checkPassword($user->getId(), "newPassword");
        $this->assertEquals(true, $result);

        $result = $this->get("app.user")->changePassword("14005200-48b1-11e9-a0b4-0242ac120005", "usertest001", "newpasswordbis");
        $this->assertEquals(false, $result);

        $result = $this->get("app.user")->checkPassword($user->getId(), "newPassword");
        $this->assertEquals(true, $result);


    }

    public function testChangePseudo()

    {
        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");

        $result = $this->get("app.user")->changePseudo($user->getId(), "newpseudo");
        $this->assertEquals(true, $result);
        $this->assertEquals("newpseudo", $user->getUsername());

        $this->removeUserByName("newpseudo");


        $user2 = $this->newUserByName("usertest002");
        $user = $this->newUserByName("usertest001");
        $result = $this->get("app.user")->changePseudo($user->getId(), "usertest002");
        $this->assertEquals(false, $result);
        $this->removeUserByName("usertest002");

        $result = $this->get("app.user")->changePseudo($user->getId(), null);
        $this->assertEquals(false, $result);


        $result = $this->get("app.user")->changePseudo("14005200-48b1-11e9-a0b4-0242ac120005", "newPseudoBis");
        $this->assertEquals(false, $result);


    }

    public function testChangeMainMail()
    {

        $user = $this->newUserByName("usertest001");

        $mail = new Mail();
        $mail->setMail("emailforphpunittest@twake_phpunit.fr");
        $mail->setUserId($user->getId());
        $this->getDoctrine()->persist($mail);
        $this->getDoctrine()->flush();

        $id = $mail->getId() . "";

        $result = $this->get("app.user")->changeMainMail($user->getId(), $id);

        $this->assertEquals(true, $result);

        $this->assertEquals("emailforphpunittest@twake_phpunit.fr", $user->getEmail());

        $this->getDoctrine()->remove($mail);
        $this->removeUserByName("usertest001");
        $this->getDoctrine()->flush();

        $result = $this->get("app.user")->changeMainMail("14005200-48b1-11e9-a0b4-0242ac120005", $id);
        $this->assertEquals(false, $result);

        $user = $this->newUserByName("usertest001");
        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->changeMainMail($user->getId(), "14005200-48b1-11e9-a0b4-0242ac120005");
        $this->assertEquals(false, $result);


    }

    public function testSetNotificationPreferences()
    {
        $user = $this->newUserByName("usertest001");
        $notif = Array(
            "key1" => "notif1",
            "key2" => "notif2"
        );
        $result = $this->get("app.user")->setNotificationPreferences($user->getId(), $notif);
        $i = 1;
        foreach ($notif as $key => $value) {

            $this->assertArrayHasKey($key, $user->getNotificationPreference());
            $this->assertEquals("notif" . $i, $user->getNotificationPreference()[$key]);
            $i++;
        }
    }

    public function testGetNotificationPreferences()
    {
        $user = $this->newUserByName("usertest001");

        $result = $this->get("app.user")->getNotificationPreferences($user->getId());

        $bool = is_array($result);
        $this->assertEquals(true, $bool);

        $result = $this->get("app.user")->getNotificationPreferences("14005200-48b1-11e9-a0b4-0242ac120005");
        $this->assertEquals(false, $result);
    }

    public function testSetWorkspacesPreferences()
    {
        $user = $this->newUserByName("usertest001");

        $preferences = Array(
            "key1" => "pref1",
            "key2" => "pref2"
        );

        $result = $this->get("app.user")->setWorkspacesPreferences($user->getId(), $preferences);

        $i = 1;
        foreach ($preferences as $key => $value) {

            $this->assertArrayHasKey($key, $user->getWorkspacesPreference());
            $this->assertEquals("pref" . $i, $user->getWorkspacesPreference()[$key]);
            $i++;
        }

    }

    public function testUpdateTutorialStatus()
    {
        $user = $this->newUserByName("usertest001");

        $status = Array(
            "key1" => "status1",
            "key2" => "status2"
        );

        $result = $this->get("app.user")->setTutorialStatus($user->getId(), $status);
        $i = 1;
        foreach ($status as $key => $value) {

            $this->assertArrayHasKey($key, $user->getTutorialStatus());
            $this->assertEquals("status" . $i, $user->getTutorialStatus()[$key]);
            $i++;
        }
    }

    public function testUpdateLanguage()
    {

        $user = $this->newUserByName("usertest001");

        $result = $this->get("app.user")->updateLanguage($user->getId(), "langage");
        $this->assertEquals("langage", $user->getLanguage());

    }

    public function testSetIsNew()
    {
        $user = $this->newUserByName("usertest001");
        $this->assertEquals(true, $user->getisNew());


        $result = $this->get("app.user")->setIsNew(false, $user->getId());
        $this->assertEquals(false, $user->getisNew());
    }

    /*public function testUpdateNotificationPreferenceByWorkspace()
    {
        $user = $this->newUserByName("usertest001");
        $result = $this->login($user->getUsernameCanonical());

        $result = $this->doPost("/ajax/users/account/update_notifications", Array(
            "workspaceId" => "14005200-48b1-11e9-a0b4-0242ac120005",
            "appNotification" => Array()
        ));
        $this->assertEquals("success", $result["data"]);
        $this->assertArrayHasKey("14005200-48b1-11e9-a0b4-0242ac120005", $user->getNotificationPreference()["workspace"]);
        $this->assertEquals(Array(), $user->getNotificationPreference()["workspace"]["14005200-48b1-11e9-a0b4-0242ac120005"]);

    }*/

    public function testRemoveUserByUsername()
    {

        $user = $this->newUserByName("usertest001");

        $result = $this->get("app.user")->removeUserByUsername($user->getUsername());

        $result = $this->doPost("/ajax/users/current/get", Array());

        $this->assertEquals("disconnected", $result["errors"]["0"]);

        $this->assertEquals(false, $this->get("app.user")->removeUserByUsername($user->getUsername()));


    }

    public function testThreeNewPassword()
    {

        $user = $this->newUserByName("usertest001");
        $result = $this->doPost("/ajax/users/recover/mail", Array(
            "email" => "usertest001@twake_phpunit.fr"
        ));
        $token = $result["data"]["token"];
        $boolean = false;
        if (is_string($token) && strlen($result["data"]["token"]) > 5) {
            $boolean = true;
        }
        $this->assertEquals(true, $boolean);

//---------------------------------------------------------------------------

        $result = $this->doPost("/ajax/users/recover/mail", Array(
            "email" => "emai1fortest@twake_phpunit.fr"
        ));
        $this->assertEquals("nosuchmail", $result["errors"][0]);

        $verif = $this->getDoctrine()->getRepository("Twake\Users:VerificationNumberMail")->findOneBy(Array("token" => $token));
        $code = $verif->getcode();
        $this->getDoctrine()->persist($verif);
        $this->getDoctrine()->flush();


        $result = $this->doPost("/ajax/users/recover/verify", Array(
            "code" => $code,
            "token" => $token
        ));

        $res = $result["data"]["status"];
        $this->assertEquals("success", $res);

        $result = $this->doPost("/ajax/users/recover/verify", Array(
            "code" => $code,
            "token" => "tokenfortest"
        ));

        $res = $result["errors"][0];
        $this->assertEquals("badcodeortoken", $res);


//-------------------------------------------------------------------------------

        $result = $this->doPost("/ajax/users/recover/password", Array(
            "code" => $code,
            "token" => $token,
            "password" => "usertest001"
        ));

        $res = $result["data"]["status"];
        $this->assertEquals("success", $res);

        $result = $this->doPost("/ajax/users/recover/password", Array(
            "code" => $code,
            "token" => "tokenfortest",
            "password" => "usertest001"
        ));

        $res = $result["errors"][0];
        $this->assertEquals("badcodeortoken", $res);

    }

    public function testSubscribeMail()
    {

        $user = $this->newUserByName("usertest001");
        $user->setMailVerified(false);
        $user->setisNew(true);
        $this->getDoctrine()->persist($user);
        $mail = $this->getDoctrine()->getRepository("Twake\Users:Mail")->findOneBy(Array("mail" => "usertest001@twake_phpunit.fr"));
        $this->getDoctrine()->remove($mail);
        $this->getDoctrine()->flush();


        $result = $this->doPost("/ajax/users/subscribe/mail", Array(
            "email" => "usertest001@twake_phpunit.fr",
            "username" => "usertestfortest",
            "password" => "usertest001",
            "name" => "namefortest",
            "firstname" => "firstnamefortest",
            "phone" => "phonefortest"
        ));

        $result = $this->doPost("/ajax/users/current/get", Array());
        $this->assertEquals("disconnected", $result["errors"]["0"]);
        $this->assertEquals(Array(), $result["data"]);


        $this->removeUserByName("usertest001");
        $result = $this->doPost("/ajax/users/subscribe/mail", Array(
            "email" => "usertest001@twake_phpunit.fr",
            "username" => "usertest001",
            "password" => "usertest001",
            "name" => "namefortest",
            "firstname" => "firstnamefortest",
            "phone" => "phonefortest"
        ));

        $token = $result["data"]["token"];

        $boolean = false;
        if (is_string($token) && strlen($result["data"]["token"]) > 5) {
            $boolean = true;
        }
        $this->assertEquals(true, $boolean);

        $user = $this->newUserByName("usertest001");
        $user = $this->getDoctrine()->getRepository("Twake\Users:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $result = $this->doPost("/ajax/users/subscribe/mail", Array(
            "email" => "usertest001_notused@twake_phpunit.fr",
            "username" => "usertest001",
            "password" => "usertest001",
            "name" => "namefortest",
            "firstname" => "firstnamefortest",
            "phone" => "phonefortest"
        ));

        $result = $result["errors"][0];
        $this->assertEquals("usernamealreadytaken", $result, "testing username available");

        $result = $this->doPost("/ajax/users/subscribe/mail", Array(
            "email" => "12345678",
            "username" => "usertestfortest",
            "password" => "usertest00D222",
            "name" => "namefortest",
            "firstname" => "firstnamefortest",
            "phone" => "phonefortest"
        ));
        $result = $result["errors"][0];
        $this->assertEquals("mailalreadytaken", $result, "Testing wrong mail format");


        $result = $this->doPost("/ajax/users/subscribe/mail", Array(
            "email" => "usertest001@twake_phpunit.fr",
            "username" => "usertestfortest",
            "password" => "usertest001",
            "name" => "namefortest",
            "firstname" => "firstnamefortest",
            "phone" => "phonefortest"
        ));
        $result = $result["errors"][0];
        $this->assertEquals("mailalreadytaken", $result, "testing mail available");


        $mailfortest = new Mail();
        $mailfortest->setMail("emailforphpunittest@twake_phpunit.fr");
        $this->getDoctrine()->persist($mailfortest);
        $this->getDoctrine()->flush();

        $result = $this->doPost("/ajax/users/subscribe/mail", Array(
            "email" => "emailforphpunittest@twake_phpunit.fr",
            "username" => "usertestfortest",
            "password" => "usertest001",
            "name" => "namefortest",
            "firstname" => "firstnamefortest",
            "phone" => "phonefortest"
        ));

        $this->removeUserByName("usertest001");


    }

}