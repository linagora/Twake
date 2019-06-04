<?php

namespace Tests\UsersBundle\Controller;

use Tests\WebTestCaseExtended;



class LoginTest extends WebTestCaseExtended

{

    public function testLoginCorrect()

    {
        $this->removeUserByName("usertest");
        $this->newUserByName("usertest");
//        $result = $this->doPost("/ajax/users/login", Array(
//            "_username" => "usertest",
//            "_password" => "usertest"
//        ));
//
//        error_log("> ".($result->getContent()));
//
//        $result = $this->doPost("/ajax/users/current/get", Array());
//
//        error_log("> ".($result->getContent()));




    }

//    public function testLoginIncorrect()
//    {
//        $this->RemoveUserByName("usertest");
//        $this->newUserByName("usertest");
//        $result = $this->doPost("/ajax/users/login", Array(
//            "_username" => "wrong email",
//        ));
//
//        error_log("> ".($result->getContent()));
//
//        $result = $this->doPost("/ajax/users/current/get", Array());
//
//        error_log("> ".($result->getContent()));
//
//    }
//
//    public function testEmailCorrect()
//    {
//        $this->RemoveUserByName("usertest");
//        $this->newUserByName("usertest");
//        $result = $this->doPost("/ajax/users/login", Array(
//            "_username" => "romaric000@yopmail.com",
//        ));
//
//        error_log("> ".($result->getContent()));
//
//        $result = $this->doPost("/ajax/users/current/get", Array());
//
//        error_log("> ".($result->getContent()));
//    }
//
//    public function testPasswordIncorrect()
//    {
//        $this->RemoveUserByName("usertest");
//        $this->newUserByName("usertest");
//        $result = $this->doPost("/ajax/users/login", Array(
//            "_username" => "invite",
//            "_password" => "wrong password"
//        ));
//
//        error_log("> ".($result->getContent()));
//
//        $result = $this->doPost("/ajax/users/current/get", Array());
//
//        error_log("> ".($result->getContent()));
//
//    }
}

