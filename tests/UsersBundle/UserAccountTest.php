<?php

namespace Tests\UsersBundle;

use Tests\WebTestCaseExtended;
use WebsiteApi\UsersBundle\Entity\Mail;

class UserAccountTest extends WebTestCaseExtended

//Tests when the user is already connected

{

    public function testAlive(){

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $alive = $this->get("app.user")->Alive($user->getId());

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $lastActivityUser = $user->getLastActivity();
        $currentDate = date("U");

        $difference = $currentDate - $lastActivityUser;

        $this->assertLessThanOrEqual(10,$difference);

    }

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
        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->changePseudo($user->getId(), "newpseudo");
        $this->assertEquals(true,$result);
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "newpseudo"));
        $this->assertEquals("newpseudo", $user->getUsername());

        $this->removeUserByName("newpseudo");


        $user = $this->newUserByName("usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->changePseudo($user->getId(), "invite");
        $this->assertEquals(false,$result);

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->changePseudo($user->getId(), null);
        $this->assertEquals(false,$result);


        $result = $this->get("app.user")->changePseudo("14005200-48b1-11e9-a0b4-0242ac120005", "newPseudoBis");
        $this->assertEquals(false,$result);




    }

    public function testChangeMainMail() {

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $mail = new Mail();
        $mail->setMail("emailforphpunittest@twake_phpunit.fr");
        $mail->setUser($user);
        $this->get("app.twake_doctrine")->persist($mail);
        $this->get("app.twake_doctrine")->flush();

        $id = $mail->getId()."";

        $result = $this->get("app.user")->changeMainMail($user->getId(), $id);

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $this->assertEquals(true, $result);

        $this->assertEquals("emailforphpunittest@twake_phpunit.fr", $user->getEmail());

        $this->get("app.twake_doctrine")->remove($mail);
        $this->removeUserByName("usertest001");
        $this->get("app.twake_doctrine")->flush();

        $result = $this->get("app.user")->changeMainMail("14005200-48b1-11e9-a0b4-0242ac120005", $id);
        $this->assertEquals(false,$result);

        $user = $this->newUserByName("usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->get("app.user")->changeMainMail($user->getId(), "14005200-48b1-11e9-a0b4-0242ac120005");
        $this->assertEquals(false,$result);


    }

//   public function testUpdateUserBasicData()  {
//
//       $this->removeUserByName("usertest001");
//       $user = $this->newUserByName("usertest001");
//       $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
//       $result = $this->get("app.user")->updateUserBasicData($user->getId(), "firstnametestphpunit", "lastnametestphpunit", null, null);
//
//       $this->assertEquals($user->getFirstName(),"firstnametestphpunit");
//       $this->assertEquals($user->getLastName(),"lastnametestphpunit");
//
//       $result = $this->get("app.user")->updateUserBasicData($user->getId(), "firstnametestphpunit2", "lastnametestphpunit2", 'null', null);
//
//       $this->assertEquals($user->getFirstName(),"firstnametestphpunit2");
//       $this->assertEquals($user->getLastName(),"lastnametestphpunit2");
//
//       $result = $this->get("app.user")->updateUserBasicData($user->getId(), "firstnametestphpunit3", "lastnametestphpunit3", 3, null);
//
//       $this->assertEquals($user->getFirstName(),"firstnametestphpunit3");
//       $this->assertEquals($user->getLastName(),"lastnametestphpunit3");
//       $this->assertEquals($user->getThumbnail(), 3);
//
//
//
//   }

    public function testSetNotificationPreferences(){

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $notif = Array(
            "key1" => "notif1",
            "key2" => "notif2"
        );
        $result = $this->get("app.user")->setNotificationPreferences($user->getId(), $notif);
        $i=1;
        foreach ($notif as $key => $value) {

            $this->assertArrayHasKey($key, $user->getNotificationPreference());
            $this->assertEquals("notif".$i,$user->getNotificationPreference()[$key]);
            $i++;
        }
    }

    public function testGetNotificationPreferences(){

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $result = $this->get("app.user")->getNotificationPreferences($user->getId());

        $bool = is_array($result);
        $this->assertEquals(true,$bool);

        $result = $this->get("app.user")->getNotificationPreferences("14005200-48b1-11e9-a0b4-0242ac120005");
        $this->assertEquals(false, $result);
    }

    public function testSetWorkspacesPreferences(){

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $preferences = Array(
            "key1" => "pref1",
            "key2" => "pref2"
        );

        $result = $this->get("app.user")->setWorkspacesPreferences($user->getId(), $preferences);

        $i=1;
        foreach ($preferences as $key => $value) {

            $this->assertArrayHasKey($key, $user->getWorkspacesPreference());
            $this->assertEquals("pref".$i,$user->getWorkspacesPreference()[$key]);
            $i++;
        }

    }

    public function testUpdateTutorialStatus(){
        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $status = Array(
            "key1" => "status1",
            "key2" => "status2"
        );

        $result = $this->get("app.user")->setTutorialStatus($user->getId(), $status);
        $i=1;
        foreach ($status as $key => $value) {

            $this->assertArrayHasKey($key, $user->getTutorialStatus());
            $this->assertEquals("status".$i,$user->getTutorialStatus()[$key]);
            $i++;
        }
    }
    public function testUpdateLanguage(){

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $result = $this->get("app.user")->updateLanguage($user->getId(), "langage");
        $this->assertEquals("langage", $user->getLanguage());

    }

    public function testSetIsNew(){
        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $this->assertEquals(true, $user->getisNew());


        $result = $this->get("app.user")->setIsNew(false, $user->getId());
        $this->assertEquals(false, $user->getisNew());
    }

    public function testUpdateNotificationPreferenceByWorkspace(){

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));

        $result = $this->doPost("/ajax/users/account/update_notifications", Array(
            "workspaceId" => "14005200-48b1-11e9-a0b4-0242ac120005",
            "appNotification" => Array()
        ));

        $this->assertEquals("success", json_decode($result->getContent(),true)["data"]);


        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));


        $this->assertArrayHasKey("14005200-48b1-11e9-a0b4-0242ac120005", $user->getNotificationPreference()["workspace"]);
        $this->assertEquals(Array(),$user->getNotificationPreference()["workspace"]["14005200-48b1-11e9-a0b4-0242ac120005"]);

    }

//    public function testUpdateTimezone(){
//
//        $this->removeUserByName("usertest001");
//        $user = $this->newUserByName("usertest001");
//        $result = $this->doPost("/ajax/users/login", Array(
//            "_username" => "usertest001",
//            "_password" => "usertest001"
//        ));
//
//        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
//
//
//        //$timezone = new \DateTimeZone("Etc/UTC");
//        //$timezone = $user->getTimezone();
////
//        //error_log(print_r($timezone,true));
////
////
//        $result = $this->doPost("/ajax/users/current/get", Array
//        (
//            "_timezone" => 2
//        ));
//        error_log(print_r($result),true);
////
////        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
////        error_log(print_r($user->getTimezone(),true));
//    }

    public function testRemoveUserByUsername(){



        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $result = $this->get("app.user")->removeUserByUsername($user->getUsername());


        $result = $this->doPost("/ajax/users/current/get", Array());

        $this->assertEquals("disconnected", json_decode($result->getContent(),true)["errors"]["0"] );

        $this->assertEquals(false, $this->get("app.user")->removeUserByUsername($user->getUsername()));


    }

//    public function testUpdateStatus(){
//
//        $this->removeUserByName("usertest001");
//        $user = $this->newUserByName("usertest001");
//        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
//
//        $result = $this->get("app.user")->updateStatus($user->getId(), "new status");
//        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
//
//        error_log(print_r($user->getStatus()));
//        //$this->assertEquals("new status", $user->getTutorialStatus());
//
//    }

    public function testThreeNewPassword(){

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        $result = $this->doPost("/ajax/users/recover/mail", Array(
            "email" => "usertest001@twake_phpunit.fr"
        ));
        $token = json_decode($result->getContent(), true)["data"]["token"];

        $boolean = false ;
        if (is_string( $token )&& strlen(json_decode($result->getContent(), true)["data"]["token"]) > 5){
            $boolean = true ;
        }
        $this->assertEquals(true,$boolean);

//---------------------------------------------------------------------------

        $result = $this->doPost("/ajax/users/recover/mail", Array(
            "email" => "emai1fortest@twake_phpunit.fr"
        ));
        $this->assertEquals("nosuchmail", json_decode($result->getContent(), true)["errors"][0]);

        $verif = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:VerificationNumberMail")->findOneBy(Array("token" => $token));
        $code = $verif->getcode();
        $this->get("app.twake_doctrine")->persist($verif);
        $this->get("app.twake_doctrine")->flush();


        $result = $this->doPost("/ajax/users/recover/verify", Array(
            "code" => $code,
            "token" => $token
        ));

        $res = json_decode($result->getContent(), true)["data"]["status"];
        $this->assertEquals("success", $res);

        $result = $this->doPost("/ajax/users/recover/verify", Array(
            "code" => $code,
            "token" => "tokenfortest"
        ));

        $res = json_decode($result->getContent(), true)["errors"][0];
        $this->assertEquals("badcodeortoken", $res);


//-------------------------------------------------------------------------------

        $result = $this->doPost("/ajax/users/recover/password", Array(
            "code" => $code,
            "token" => $token,
            "password" => "usertest001"
        ));

        $res = json_decode($result->getContent(), true)["data"]["status"];
        $this->assertEquals("success", $res);

        $result = $this->doPost("/ajax/users/recover/password", Array(
            "code" => $code,
            "token" => "tokenfortest",
            "password" => "usertest001"
        ));

        $res = json_decode($result->getContent(), true)["errors"][0];
        $this->assertEquals("badcodeortoken", $res);

    }

    public function testSubscribeMail(){

        $this->removeUserByName("usertest001");

        $user = $this->newUserByName("usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("emailcanonical" => "usertest001@twake_phpunit.fr"));
        $user->setMailVerified(false);
        $user->setisNew(true);
        $this->get("app.twake_doctrine")->persist($user);
        $mail = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:Mail")->findOneBy(Array("mail" => "usertest001@twake_phpunit.fr"));
        $this->get("app.twake_doctrine")->remove($mail);
        $this->get("app.twake_doctrine")->flush();


        $result = $this->doPost("/ajax/users/subscribe/mail", Array(
            "email" => "usertest001@twake_phpunit.fr",
            "username" => "usertestfortest",
            "password" => "usertest001",
            "name" => "namefortest",
            "firstname" => "firstnamefortest",
            "phone" => "phonefortest"
        ));

        $result = $this->doPost("/ajax/users/current/get", Array());
        $this->assertEquals("disconnected", json_decode($result->getContent(),true)["errors"]["0"] );
        $this->assertEquals(Array(), json_decode($result->getContent(), true)["data"]);



        $this->removeUserByName("usertest001");
        $result = $this->doPost("/ajax/users/subscribe/mail", Array(
            "email" => "usertest001@twake_phpunit.fr",
            "username" => "usertest001",
            "password" => "usertest001",
            "name" => "namefortest",
            "firstname" => "firstnamefortest",
            "phone" => "phonefortest"
        ));

        $token = json_decode($result->getContent(), true)["data"]["token"];

        $boolean = false ;
        if (is_string( $token )&& strlen(json_decode($result->getContent(), true)["data"]["token"]) > 5){
            $boolean = true ;
        }
        $this->assertEquals(true,$boolean);

        $user = $this->newUserByName("usertest001");
        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $result = $this->doPost("/ajax/users/subscribe/mail", Array(
            "email" => "usertest001@twake_phpunit.fr",
            "username" => "usertest001",
            "password" => "usertest001",
            "name" => "namefortest",
            "firstname" => "firstnamefortest",
            "phone" => "phonefortest"
        ));

        $result = json_decode($result->getContent(), true)["errors"][0];
        $this->assertEquals("error_mail_or_password", $result, "testing username available");



        $result = $this->doPost("/ajax/users/subscribe/mail", Array(
            "email" => "usertest001@twake_phpunit.fr",
            "username" => "usertestfortest",
            "password" => "usertest001",
            "name" => "namefortest",
            "firstname" => "firstnamefortest",
            "phone" => "phonefortest"
        ));
        $result = json_decode($result->getContent(), true)["errors"][0];
        $this->assertEquals("error_mail_or_password", $result, "testing username available");

        $result = $this->doPost("/ajax/users/subscribe/mail", Array(
            "email" => "123456",
            "username" => "usertestfortest",
            "password" => "usertest001",
            "name" => "namefortest",
            "firstname" => "firstnamefortest",
            "phone" => "phonefortest"
        ));
        $result = json_decode($result->getContent(), true)["errors"][0];
        $this->assertEquals("error_mail_or_password", $result, "testing username available");


        $mailfortest = new Mail();
        $mailfortest->setMail("emailforphpunittest@twake_phpunit.fr");
        $this->get("app.twake_doctrine")->persist($mailfortest);
        $this->get("app.twake_doctrine")->flush();

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