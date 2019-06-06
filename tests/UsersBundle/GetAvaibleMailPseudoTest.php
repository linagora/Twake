<?php

namespace Tests\UsersBundle;

use Tests\WebTestCaseExtended;

class GetAvailableMailPseudoTest extends WebTestCaseExtended
{

    public function testAvailableMail(){

        $this->removeUserByName("usertest001");
        $result = $this->get("app.user")->getAvaibleMailPseudo("usertest001@twake_phpunit.fr","usertest001");
        $this->assertEquals(true,$result);

        $user = $this->newUserByName("usertest001");
        $result = $this->get("app.user")->getAvaibleMailPseudo("usertest001@twake_phpunit.fr","usertest001");
        $this->assertGreaterThan(0,count($result));

        $result = $this->get("app.user")->getAvaibleMailPseudo("wrong email","usertest001");
        $this->assertGreaterThan(0,count($result));




    }

}