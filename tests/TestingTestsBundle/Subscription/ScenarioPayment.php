<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 20/06/18
 * Time: 14:08
 */

namespace Tests\TestingTestsBundle\Subscription;

use Tests\WebTestCaseExtended;
use WebsiteApi\WorkspacesBundle\Entity\PricingPlan;

class ScenarioPayment {

    var $doctrine;

    var $fp;

    var $list_freq;

    var $group_id;

    var $date_interval;

    var $services;

    var $subscription;

    /**
     * ScenarioPayment constructor.
     */
    public function __construct($services, $user_mail, $pseudo, $password, $group_name, $workspace_name,$pricing_plan, $nb_total_users, $doctrine, $date_interval, $list_freq){
        $this->list_freq = $list_freq;
        $this->date_interval = $date_interval;
        $this->services = $services;
        $this->doctrine = $doctrine;
        $this->workspace_name = $workspace_name;

        $pricing_plan_id = $pricing_plan->getId();
        $token = $this->services->myGet("app.user")->subscribeMail($user_mail);
        $user = $this->services->myGet("app.user")->subscribe($token, null, $pseudo, $password, true);

        $uniquename = $this->services->myGet("app.string_cleaner")->simplify($group_name);
        $group = $this->services->myGet("app.groups")->create($user->getId(), $group_name, $uniquename, $pricing_plan_id);

        $this->group_id = $group->getId();
        $this->services->myGet("app.workspaces")->create($workspace_name, $this->group_id, $user->getId());
        $balance = $pricing_plan->getMonthPrice()*$nb_total_users;

        $end_date =  (new \DateTime('now'))->sub(($this->date_interval));
        $start_date = (new \DateTime('now'))->sub(($this->date_interval));

        $this->subscription = $this->services->myGet("app.subscription_manager")->newSubscription($group,$pricing_plan, $balance,
            $start_date->sub(($this->date_interval)), $end_date, false, false, $balance);


        for($i=1;$i<$nb_total_users;$i++){
            $this->addMember($i."benoit.tallandier@telecomnancy.net", $i."Benoit", "lulu", $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("name" => $this->workspace_name)));
        }
    }


    public function exec(){
        $this->fp = fopen('file.csv', 'w');
        $csv = array();
        array_push($csv,array("day","current_cost","estimated_cost","check_end_period","overusing_or_not","overCost"));

        $days = $this->date_interval->d;

        for ($i = 1; $i <= $days; $i++)
            $csv = $this->DayByDayScenario($this->list_freq, $i, $this->group_id, $csv);

        $this->EndScenario($this->fp,$csv);

        fclose($this->fp);
    }


    public function addMember($user_mail, $pseudo, $password, $workspace_id){
        $token = $this->services->myGet("app.user")->subscribeMail($user_mail);
        $user = $this->services->myGet("app.user")->subscribe($token, null, $pseudo, $password, true);

        $this->services->myGet("app.workspace_members")->addMember($workspace_id, $user->getId(), false, null, null);
    }



    public function DayByDayScenario($list, $day, $group_id, $csv){
        for ($i = 0; $i < count($list); $i++) {
            $group = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser")->findOneBy(Array("user" => $i + 1));
            if ($group == null)
                break;
            if (($day % $list[$i]) == 0) {
                $group->increaseConnectionsPeriod();
                $this->doctrine->persist($group);
            }
        }

            $this->addUserToList($day."romaric.t"."@twakeapp.com",$day."romaric",$day."blabla",1);

        /*if ($day == 5){
            $this->addUserToList("damien.vantourout@telecomnancy.net","POLO","b",1);
        }
        if ($day == 15){
            $this->addUserToList("jeremy.hynes@telecomnancy.net","Jeremy","b",1);
        }*/

        $gp = $this->services->myGet("app.subscription_system")->getGroupPeriod($group_id);
        $startAt = $gp->getPeriodStartedAt();
        $startAt->sub(new \DateInterval("P1D"));
        $gp->setPeriodStartedAt($startAt);
        $this->doctrine->persist($gp);

        $periodExpectedToEndAt = $gp->getPeriodExpectedToEndAt();
        $periodExpectedToEndAt->sub(new \DateInterval("P1D"));
        $gp->setPeriodExpectedToEndAt($periodExpectedToEndAt);
        $this->doctrine->persist($gp);

        $startDate = $this->subscription->getStartDate();
        $startDate->add(new \DateInterval("P1D"));
        $this->subscription->setStartDate($startDate);
        $this->doctrine->persist($this->subscription);


        $endDate = $this->subscription->getEndDate();
        $endDate->add(new \DateInterval("P1D"));
        $this->subscription->setEndDate($endDate);
        $this->doctrine->persist($this->subscription);

        $this->doctrine->flush();

        $this->services->myGet("app.pricing_plan")->dailyDataGroupUser();
        $this->services->myGet("app.pricing_plan")->groupPeriodUsage();
        $checkEndPeriodByGroup = $this->services->myGet("app.subscription_manager")->checkEndPeriodByGroup($group_id);
        $checkOverusingByGroup = $this->services->myGet("app.subscription_manager")->checkOverusingByGroup($group_id);

        $overCost = 0;
        if ($checkOverusingByGroup !=12 && $checkOverusingByGroup != 11){
            $overCost = $this->services->myGet("app.subscription_system")->getOverCost($group_id);
        }

        $gp_current_cost = $gp->getCurrentCost();
        $gp_estimated_cost = $gp->getEstimatedCost();

        $subcription2 = $this->services->myGet("app.subscription_system")->get($group_id);
        $balance = $subcription2->getBalance();
        $balance_consumed = $subcription2->getBalanceConsumed();

        $line_csv = array($day, $gp_current_cost, $gp_estimated_cost,$checkEndPeriodByGroup,$checkOverusingByGroup, $overCost, $balance, $balance_consumed);
        array_push($csv,$line_csv);


        $this->doctrine->flush();
        return $csv;
    }


    public function EndScenario($fp, $csv){
        $this->services->myGet("app.pricing_plan")->dailyDataGroupUser();
        $this->services->myGet("app.pricing_plan")->groupPeriodUsage();

        foreach ($csv as $item) {
            fputcsv($fp, $item);
        }

    }


    public function changeFreq($freq, $user_id){
        $this->list_freq[$user_id -1] = $freq;
    }

    public function addUserToList($user_mail, $pseudo, $password, $freq){
        $this->addMember($user_mail, $pseudo, $password, $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("name" => $this->workspace_name)));
        array_push($this->list_freq,$freq);

    }

}