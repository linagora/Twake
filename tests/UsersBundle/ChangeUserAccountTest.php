<?php

namespace Tests;

use Tests\WebTestCaseExtended;
use WebsiteApi\UsersBundle\Entity\Mail;

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
    public function testUpdateTimezone(){

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");
        $result = $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));

        $timezone = new \DateTimeZone("Etc/UTC");
//
        error_log(print_r($timezone,true));


        $result = $this->doPost("/ajax/users/current/get", Array
        (
            "_timezone" => 2
        ));

        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
        error_log(print_r($user->getTimezone(),true));
    }

}