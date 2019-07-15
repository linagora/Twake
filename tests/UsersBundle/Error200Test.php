<?php
//
//namespace Tests\UsersBundle;
//
//use Tests\WebTestCaseExtended;
//
//class Error200Test extends WebTestCaseExtended
//
//{
//    public function testErrorRemoveSecondaryMail(){
//
//        $this->removeUserByName("usertest001");
//        $user = $this->newUserByName("usertest001");
//
//
//        $result = $this->doPost("/ajax/users/login", Array(
//            "_username" => "usertest001",
//            "_password" => "usertest001"
//        ));
//
//        $result = $this->doPost("/ajax/users/account/removemail", Array(
//            "mail" => "14005200-48b1-11e9-a0b4-0242ac120005"
//        ));
//
//
//        $this->assertEquals(200, $result->getStatusCode());
//    }
//
//    public function testCheckNumberForAddNewMail(){
//
//        $this->removeUserByName("usertest001");
//        $user = $this->newUserByName("usertest001");
//        $user = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("usernamecanonical" => "usertest001"));
//
//        $result = $this->doPost("/ajax/users/login", Array(
//            "_username" => "usertest001",
//            "_password" => "usertest001"
//        ));
//
//        $result = $this->doPost("/ajax/users/recover/mail", Array(
//            "email" => "usertest001@twake_phpunit.fr"
//        ));
//        $token = json_decode($result->getContent(), true)["data"]["token"];
//
//        $verif = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:VerificationNumberMail")->findOneBy(Array("token" => $token));
//        $code = $verif->getcode();
//        $this->get("app.twake_doctrine")->persist($verif);
//        $this->get("app.twake_doctrine")->flush();
//
//
//        $result = $this->doPost("/ajax/users/account/addmailverify", Array(
//            "token" => $token,
//            "code" => $code
//        ));
//
//        $this->assertEquals(200, $result->getStatusCode());
//
//    }
//
//}