<?php
namespace tests\WebTestCaseExtended\Workspace;

use Tests\WebTestCaseExtended;

class InitTest extends WebTestCaseExtended
{
    public function testIndex()
    {
        /**
        * $user = $this->newUser();
        * $group = $this->newGroup($user->getId());
        * $workspace = $this->newWorkspace($group->getId());
         *
         * $appsRepository = $this->get("app.doctrine_adapter")->getRepository("TwakeMarketBundle:Application");
        * $defaultapps = $appsRepository->findBy(Array("default" => true));
        * $nbdefaultapps = count($defaultapps);
         *
         * $groupappsRepository = $this->get("app.doctrine_adapter")->getRepository("TwakeWorkspacesBundle:GroupApp");
        * $groupapps = $groupappsRepository->findBy(Array("group" => $group));
        * $defaultgroupapps = $groupappsRepository->findBy(Array("group" => $group,"workspaceDefault" => true));
        * $nbdefaultgroupapps = count($defaultgroupapps);
         *
         *
         * $workspaceappRepository = $this->get("app.doctrine_adapter")->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
        * $workspaceapp = $workspaceappRepository->findBy(Array("workspace" => $workspace));
 *
* $ga_appsarray = $this->get("app.group_apps")->getApps($group->getId());
        * $wa_appsarray = $this->get("app.workspaces_apps")->getApps($workspace->getId());
 *
* $this->assertTrue(count($groupapps) == $nbdefaultapps,"Database/Init not functioning properly");
        * $this->assertTrue(count($workspaceapp) == $nbdefaultapps,"Database/Init not functioning properly");
 *
* //Service Test
        * $this->assertTrue(count($ga_appsarray) == $nbdefaultapps,"GroupApps Service not functioning properly");
 *
* $this->assertTrue(count($wa_appsarray) == $nbdefaultgroupapps,"WorkspaceApps Service not functioning properly");
 *
* //Both
        * $this->assertTrue(count($groupapps) == count($ga_appsarray) && count($ga_appsarray) == count($wa_appsarray),"Inconsistancy between Service and Database");
        */
    }
}
