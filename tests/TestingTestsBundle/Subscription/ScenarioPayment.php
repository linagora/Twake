<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 20/06/18
 * Time: 14:08
 */

namespace Tests\TestingTestsBundle\Subscription;


class ScenarioPayment {

    /**
     * ScenarioPayment constructor.
     */
    public function __construct($user_mail, $pseudo, $password, $group_name, $workspace_name, $pricing_plan){
        $pricing_plan_id = $pricing_plan->getId();
        $token = $this->get("app.user")->subscribeMail($user_mail);
        $user = $this->get("app.user")->subscribe($token, null, $pseudo, $password, true);

        $uniquename = $this->get("app.string_cleaner")->simplify($group_name);
        $group = $this->get("app.groups")->create($user->getId(), $group_name, $uniquename, $pricing_plan_id);

        $groupId = $group->getId();
        $this->get("app.workspaces")->create($workspace_name, $groupId, $user->getId());
        $subscription = $this->newSubscription($group,$pricing_plan, $pricing_plan->getMonthPrice(),
            (new \DateTime('now'))->sub(new \DateInterval("P1M")), (new \DateTime('now')), false, false);
    }

    public function addMember($user_mail, $pseudo, $password, $workspace_id){
        $token = $this->get("app.user")->subscribeMail($user_mail);
        $user = $this->get("app.user")->subscribe($token, null, $pseudo, $password, true);

        $this->get("app.workspace_members")->addMember($workspace_id, $user->getId(), false, null, null);
    }


    public function DayByDayScenario($list, $day, $group_id, $csv){
        for ($i = 0; $i < count($list); $i++) {
            $group = $this->getDoctrine()->getRepository("TwakeWorkspacesBundle:GroupUser")->findOneBy(Array("user" => $i + 1));
            if ($group == null)
                break;
            if (($day % $list[$i]) == 0) {
                $group->increaseConnectionsPeriod();
                $this->getDoctrine()->persist($group);
            }
        }

        $gp = $this->get("app.subscription_system")->getGroupPeriod($group_id);
        $startAt = $gp->getPeriodStartedAt();
        $startAt->sub(new \DateInterval("P1D"));
        $gp->setPeriodStartedAt($startAt);
        $this->getDoctrine()->persist($gp);
        $this->getDoctrine()->flush();

        $this->get("app.pricing_plan")->dailyDataGroupUser();
        $this->get("app.pricing_plan")->groupPeriodUsage();

        $gp_current_cost = $gp->getCurrentCost();
        $gp_estimated_cost = $gp->getEstimatedCost();

        $line_csv = array($day, $gp_current_cost, $gp_estimated_cost);
        array_push($csv,$line_csv);


        $this->getDoctrine()->flush();
        return $csv;
    }


    public function EndScenario($fp, $csv){
        $this->get("app.pricing_plan")->dailyDataGroupUser();
        $this->get("app.pricing_plan")->groupPeriodUsage();

        foreach ($csv as $item) {
            fputcsv($fp, $item);
        }

    }

}