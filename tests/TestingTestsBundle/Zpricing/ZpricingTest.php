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

        $pricing = new \WebsiteApi\WorkspacesBundle\Entity\PricingPlan("phpunit");

        
        $this->getDoctrine()->flush();

        return $group;

    }

    public function testIndex()
    {
        $group = $this->initData();
        $this->assertIncrementDailyData();

       // $group = $this->initData();
        $this->assertDates($group);

        //$group = $this->initData();
        $this->assertNbConnection();
        $this->assertNbConnections();
        $this->assertConnection();
    }

    public function assertIncrementDailyData(){
        $groupUserRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:groupUser");
        $userRepository = $this->getDoctrine()->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->findOneBy(Array("username" => "phpunit"));
        $groupUser = $groupUserRepository->findOneBy(Array("user" => $user));

        $nbConnectionBase = $groupUser->getConnections();

        $groupUser->setLastDayOfUpdate(date('z'));
        $groupUser->setDidConnect(1);
        $groupUser->setUsedApps(["14"]);

        $this->getDoctrine()->persist($groupUser);
        $this->getDoctrine()->flush();

        // appeler une fois le cron
        $this->get("app.pricing_plan")->dailyDataGroupUser();

        $this->assertTrue($nbConnectionBase+1 == $groupUser->getConnections() , "test increment daily data" );
        $this->assertTrue(0 == $groupUser->getDidConnect() , "test remove did connect" );
        $this->assertTrue([] == $groupUser->getUsedApps() , "test remove daily used apps" );
        $this->assertTrue(["14"=>1] == $groupUser->getAppsUsage() , "test increment add monthly used apps" );

    }

    public function assertDates($group){

        $groupPeriodRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupPeriod");
        $groupPeriod = $groupPeriodRepository->findOneBy(Array("group" => $group));

        $datedeb = $groupPeriod->getPeriodStartedAt();
        $datedebPricing = $groupPeriod->getGroupPricingInstance()->getStartedAt();
        $datefin= $groupPeriod->getPeriodExpectedToEndAt();

        $this->assertEquals($datedeb->getTimestamp(), $datedebPricing->getTimestamp(), 'Time of start and pricing start is not equal', 5);
        $datedeb->modify('+1 month');
        $this->assertEquals($datedeb->getTimestamp(), $datefin->getTimestamp(), 'Time of start - end is not 1 month ', 5);

    }

    public function assertRenew($group){


        $groupPricingInstanceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupPricingInstance");
        $groupPricingInstance = $groupPricingInstanceRepository->findOneBy(Array("group" => $group));

        $res = $this->get("app.group_period")->changePlanOrRenew($group,"monthly",1);

        $this->assertEquals($res, true, 'renew billing went Wrong : No group period  associated with test group');

        $groupPricingInstanceRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupPricingInstance");
        $newGroupPricingInstance = $groupPricingInstanceRepository->findOneBy(Array("group" => $group));

        $this->assertTrue($groupPricingInstance->getId() != $newGroupPricingInstance->getId() , "Error : renew did not generate a new billing instance");



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

        $this->assertTrue($nbConnectionBase+$i == $groupUser->getConnections() , "test increment 1 connexion" );

    }


    /**
     * Verify when user have last day of update
     */

    public function assertNbConnections(){
        $groupUserRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:groupUser");
        $userRepository = $this->getDoctrine()->getRepository("TwakeUsersBundle:User");

        $user = $userRepository->findOneBy(Array("username" => "phpunit1"));

        $groupUser = $groupUserRepository->findOneBy(Array("user" => $user));
        $nbConnectionBase = $groupUser->getConnections();

            $groupUser->setLastDayOfUpdate(date('z')+1);
            $groupUser->setDidConnect(1);
            $groupUser->setUsedApps(["14"]);


            $this->getDoctrine()->persist($groupUser);
            $this->getDoctrine()->flush();

            $this->get("app.pricing_plan")->dailyDataGroupUser();

        $this->assertTrue($nbConnectionBase == $groupUser->getConnections() , "should be same number because of the date" );
        $this->assertTrue(1 == $groupUser->getDidConnect() , "should stay as 1 - true" );

    }

    /**
     * Verify when GroupUser connect without use
     */

    public function assertConnection(){
        $groupUserRepository = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:groupUser");
        $userRepository = $this->getDoctrine()->getRepository("TwakeUsersBundle:User");

        $user = $userRepository->findOneBy(Array("username" => "phpunit3"));

        $groupUser = $groupUserRepository->findOneBy(Array("user" => $user));
        $nbConnectionBase = $groupUser->getConnections();

        $groupUser->setLastDayOfUpdate(date('z'));
        $groupUser->setDidConnect(1);

        $this->getDoctrine()->persist($groupUser);
        $this->getDoctrine()->flush();

        $this->get("app.pricing_plan")->dailyDataGroupUser();

        $this->assertTrue($nbConnectionBase+1 == $groupUser->getConnections() , "should be same number because of the date" );
        $this->assertTrue(0 == $groupUser->getDidConnect() , "should be 0 - false" );
        $this->assertTrue(0 == $groupUser->getDidConnect() , "test remove did connect" );
        $this->assertTrue([] == $groupUser->getUsedApps() , "test remove daily used apps" );

    }

    public function getMonthlyData(){

    }

}