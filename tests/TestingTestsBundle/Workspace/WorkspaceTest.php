<?php
namespace tests\TestingTestsBundle\Workspace;

use Tests\WebTestCaseExtended;
use WebsiteApi\WorkspacesBundle\Services\Groups;
use WebsiteApi\UsersBundle\Services\User;
/**
 * Created by PhpStorm.
 * User: yoanf
 * Date: 12/04/2018
 * Time: 10:21
 */
class WorkspaceTest extends WebTestCaseExtended
{
    public function testIndex()
    {
        $this->destroyTestData();

        $user = $this->newUser();
        $group = $this->newGroup($user->getId());
        $work = $this->newWorkspace($group->getId());

        $this->getDoctrine()->flush();
        $groupappsRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupApp");
        $groupapps = $groupappsRepository->findBy(Array("group" => $group));

        $workspaceappRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
        $workspaceapp = $workspaceappRepository->findBy(Array("workspace" => $work));

        $npWorkApp = count($workspaceapp);

        // disable
         $this->get("app.workspaces_apps")->disableApp($work->getId(),34);
        $workspaceapp = $workspaceappRepository->findBy(Array("workspace" => $work));

        $this->assertTrue($npWorkApp-1 == count($workspaceapp) , "test desactiver appplication" );

        // enable
        $this->get("app.workspaces_apps")->enableApp($work->getId(),34);
        $workspaceapp = $workspaceappRepository->findBy(Array("workspace" => $work));
        $this->assertTrue($npWorkApp == count($workspaceapp) , "test activer appplication" );

        $this->getDoctrine()->flush();
    }
}