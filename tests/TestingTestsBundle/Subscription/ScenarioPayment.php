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

    /**
     * ScenarioPayment constructor.
     */
    public function __construct($services, $user_mail, $pseudo, $password, $group_name, $workspace_name,$pricing_plan, $nb_total_users, $doctrine, $date_interval, $list_freq){
        $this->list_freq = $list_freq;
        $this->date_interval = $date_interval;
        $this->services = $services;
        $this->doctrine = $doctrine;

        $pricing_plan_id = $pricing_plan->getId();
        $token = $this->services->myGet("app.user")->subscribeMail($user_mail);
        $user = $this->services->myGet("app.user")->subscribe($token, null, $pseudo, $password, true);

        $uniquename = $this->services->myGet("app.string_cleaner")->simplify($group_name);
        $group = $this->services->myGet("app.groups")->create($user->getId(), $group_name, $uniquename, $pricing_plan_id);

        $this->group_id = $group->getId();
        $this->services->myGet("app.workspaces")->create($workspace_name, $this->group_id, $user->getId());
        $balance = $pricing_plan->getMonthPrice();
        $subscription = $this->services->myGet("app.subscription_manager")->newSubscription($group,$pricing_plan, $balance,
            (new \DateTime('now'))->sub($this->date_interval), (new \DateTime('now')), false, false, $balance);

        for($i=1;$i<$nb_total_users;$i++){
            $this->addMember($i."benoit.tallandier@telecomnancy.net", $i."Benoit", "lulu", $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("name" => $workspace_name)));
        }
    }


    public function exec(){
        $this->fp = fopen('file.csv', 'w');
        $csv = array();
        array_push($csv,array("day","current_cost","estimated_cost"));

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

        $gp = $this->services->myGet("app.subscription_system")->getGroupPeriod($group_id);
        $startAt = $gp->getPeriodStartedAt();
        $startAt->sub(new \DateInterval("P1D"));
        $gp->setPeriodStartedAt($startAt);
        $this->doctrine->persist($gp);
        $this->doctrine->flush();

        $this->services->myGet("app.pricing_plan")->dailyDataGroupUser();
        $this->services->myGet("app.pricing_plan")->groupPeriodUsage();

        $gp_current_cost = $gp->getCurrentCost();
        $gp_estimated_cost = $gp->getEstimatedCost();

        $line_csv = array($day, $gp_current_cost, $gp_estimated_cost);
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

}