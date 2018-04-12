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
        // $this->getDoctrine(); // Get Doctrine Entity Manager
        $user = $this->newUser();

        $group = $this->newGRoup($user->getId());

        $work = $this->newWorkspace($group->getId());

        $this->assertTrue($work->getName() =="mon workspace PHPUNIT" , "test création workspace" );

        // remove all entity created
        $this->getDoctrine()->remove($user);
        $this->getDoctrine()->remove($group);
        $this->getDoctrine()->remove($work);

        $this->getDoctrine()->flush();
    }
}