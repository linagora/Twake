<?php

use Tests\WebTestCaseExtended;

/**
 * Created by PhpStorm.
 * User: yoanf
 * Date: 02/05/2018
 * Time: 14:09
 */
class ZpricingTest extends WebTestCaseExtended
{

    public function initData(){
        $this->destroyTestData();

        $user = $this->newUser();
        $this->getDoctrine()->persist($user);
        $this->getDoctrine()->flush();

        $group = $this->newGroup($user->getId());
        $this->getDoctrine()->persist($group);
        $this->getDoctrine()->flush();

        $work = $this->newWorkspace($group->getId());
        $this->getDoctrine()->persist($work);
        $this->getDoctrine()->flush();

        $this->get("app.workspace_members")->addMember($work->getId(),$user->getId());

        // creer des utilisateurs
        for($i = 1; $i < 10 ; $i++){
            $user = $this->newUserByName("PHPUNIT".$i);
            $this->get("app.workspace_members")->addMember($work->getId(),$user->getId());
            $this->getDoctrine()->persist($user);
        }

        $this->getDoctrine()->flush();

    }

    public function testIndex()
    {
        $this->initData();
        $this->assertNbConnection();
    }

    public function assertNbConnection(){
        $groupUserRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:groupUser");
        $userRepository = $this->getDoctrine()->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->findOneBy(Array("username" => "phpunit"));
        $groupUser = $groupUserRepository->findOneBy(Array("user" => $user));

        $nbConnectionBase = $groupUser->getConnections();

        $i = 0;
        for($i; $i < 5 ; $i++){
            $groupUser->setLastDayOfUpdate(date('z'));
            $groupUser->setDidConnect(1);
            $groupUser->setUsedApps(["14"]);

            $this->getDoctrine()->persist($groupUser);
            $this->getDoctrine()->flush();

            $this->get("app.pricing_plan")->dailyDataGroupUser();

        }

        $this->assertTrue($nbConnectionBase+$i == $groupUser->getConnections() , "test incrémentation 1 connexion" );

    }
}