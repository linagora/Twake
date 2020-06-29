<?php

namespace Tests\UsersBundle;

require_once __DIR__ . "/../WebTestCaseExtended.php";

use Tests\WebTestCaseExtended;

class Error200Test extends WebTestCaseExtended

{
    public function testErrorRemoveSecondaryMail()
    {

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001");


        $result = $this->login($user->getUsernameCanonical());

        $result = $this->doPost("/ajax/users/account/removemail", Array(
            "mail" => "14005200-48b1-11e9-a0b4-0242ac120005"
        ));

        $this->assertEquals(Array("badmail"), $result["errors"]);
    }


    public function testCheckNumberForAddNewMail()
    {

        $this->removeUserByName("usertest001");
        $user = $this->newUserByName("usertest001", "usertest001@twake_phpunit.fr");
        $this->login($user->getUsernameCanonical());

        $result = $this->doPost("/ajax/users/account/addmail", Array(
            "mail" => "usertest0021@twake_phpunit.fr"
        ));

        $token = $result["data"]["token"];

        $verif = $this->get("app.twake_doctrine")->getRepository("Twake\Users:VerificationNumberMail")->findOneBy(Array("token" => $token));
        $code = $verif->getCleanCode();

        $result = $this->doPost("/ajax/users/account/addmailverify", Array(
            "token" => $token,
            "code" => $code
        ));
        $this->assertEquals(Array(), $result["errors"]);

    }

}