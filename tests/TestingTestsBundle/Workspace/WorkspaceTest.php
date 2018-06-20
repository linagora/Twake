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

        /*
        $user = $this->newUser();
        $group = $this->newGroup($user->getId());
        $work = $this->newWorkspace($group->getId());

        $this->getDoctrine()->flush();

        $workspaceappRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
        $workspaceapp = $workspaceappRepository->findBy(Array("workspace" => $work));

        $app = $workspaceapp[0];

        $npWorkApp = count($workspaceapp);

        // disable
        $this->get("app.workspaces_apps")->disableApp($work->getId(), $app->getGroupapp()->getApp()->getId());
        $workspaceapp = $workspaceappRepository->findBy(Array("workspace" => $work));

        $this->assertEquals($npWorkApp - 1, count($workspaceapp), "test desactiver appplication");

        // enable
        $this->get("app.workspaces_apps")->enableApp($work->getId(), $app->getGroupapp()->getApp()->getId());
        $workspaceapp = $workspaceappRepository->findBy(Array("workspace" => $work));
        $this->assertEquals($npWorkApp, count($workspaceapp), "test activer appplication");

        $this->getDoctrine()->flush();
        */
    }
}