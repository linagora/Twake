<?php
namespace tests\WebTestCaseExtended\Workspace;

use Tests\WebTestCaseExtended;

class InitTest extends WebTestCaseExtended
{
    public function testIndex()
    {
        $this->destroyTestData();

        $user = $this->newUser();
        $group = $this->newGroup($user->getId());
        $workspace = $this->newWorkspace($group->getId());

        $groupappsRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupApp");
        $groupapps = $groupappsRepository->findBy(Array("group" => $group));

        $workspaceappRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
        $workspaceapp = $workspaceappRepository->findBy(Array("workspace" => $workspace));

        $ga_appsarray = $this->get("app.group_apps")->getApps($group->getId());
        $wa_appsarray = $this->get("app.workspaces_apps")->getApps($group->getId());


        $this->assertTrue(count($groupapps) == 7,"Database/Init not functioning properly");
        $this->assertTrue(count($workspaceapp) == 7,"Database/Init not functioning properly");


        //Service Test
        $this->assertTrue(count($ga_appsarray) == 7,"GroupApps Service not functioning properly");
        $this->assertTrue(count($wa_appsarray) == 7,"WorkspaceApps Service not functioning properly");

        //Both
        $this->assertTrue(count($groupapps) == count($ga_appsarray) && count($ga_appsarray) == count($wa_appsarray),"Inconsistancy between Service and Database");
    }
}
