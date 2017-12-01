<?php

namespace Tests\WebsiteApi\Controller;

use Tests\WebTestCaseExtended;

class GroupMembersInviteTest extends WebTestCaseExtended
{
    public function testIndex()
    {
        $this->api('/ajax/group/members/verify',Array("request" => "coucou"));
        $this->assertContains("unknown",$res["status"],  "Verify");
        $this->api('/ajax/group/members/verify',Array("request" => "UnitTest"));
        $this->assertContains("username",$res["status"],  "Verify");
        $this->api('/ajax/group/members/verify',Array("request" => "UnitTest@citigo.fr"));
        $this->assertContains("mail",$res["status"],  "Verify");

    }

}
