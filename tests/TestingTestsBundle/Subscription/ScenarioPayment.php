<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 20/06/18
 * Time: 14:08
 */

namespace Tests\TestingTestsBundle\Subscription;

use Tests\WebTestCaseExtended;
use WebsiteApi\PaymentsBundle\Entity\GroupIdentity;
use WebsiteApi\WorkspacesBundle\Entity\GroupPeriod;
use WebsiteApi\WorkspacesBundle\Entity\PricingPlan;

class ScenarioPayment {

    var $doctrine;
    var $fp;
    var $list_freq;
    var $group_id;
    var $date_interval;
    var $services;
    var $subscription;
    var $day_over_cost;
    var $auto_withdrawal;
    var $auto_renew;
    var $pricing_plan;
    var $nb_total_users;
    var $new_pricing_plan;
    var $group;


    /**
     * ScenarioPayment constructor.
     */
    public function __construct($services, $user_mail, $pseudo, $password, $group_name, $workspace_name,$pricing_plan,
                                $nb_total_users, $doctrine, $date_interval, $list_freq, $auto_withdrawal, $auto_renew,
                                $new_pricing_plan = null){
        $this->list_freq = $list_freq;
        $this->date_interval = $date_interval;
        $this->services = $services;
        $this->doctrine = $doctrine;
        $this->workspace_name = $workspace_name;
        $this->auto_renew = $auto_renew;
        $this->auto_withdrawal = $auto_withdrawal;
        $this->pricing_plan = $pricing_plan;
        $this->nb_total_users = $nb_total_users;
        $this->new_pricing_plan = $new_pricing_plan;

        //Création user
        $pricing_plan_id = $pricing_plan->getId();
        $token = $this->services->myGet("app.user")->subscribeMail($user_mail);
        $user = $this->services->myGet("app.user")->subscribe($token, null, $pseudo, $password, true);

        //Création group
        $uniquename = $this->services->myGet("app.string_cleaner")->simplify($group_name);
        $this->group = $this->services->myGet("app.groups")->create($user->getId(), $group_name, $uniquename, $pricing_plan_id);
        $group_identity = new GroupIdentity($this->group, "twakeapp", "twakeapp", "damien.vantourout@telecomnancy.net", "06 06 49 36 81");
        $this->doctrine->persist($group_identity);
        $this->doctrine->flush();

        //Création workspace
        $this->group_id = $this->group->getId();
        $this->services->myGet("app.workspaces")->create($workspace_name, $this->group_id, $user->getId());
        $balance = $pricing_plan->getMonthPrice()*$nb_total_users;

        //Création abonnement
        $end_date =  (new \DateTime('now'))->sub(($this->date_interval));
        $start_date = (new \DateTime('now'))->sub(($this->date_interval));
        $this->subscription = $this->services->myGet("app.subscription_manager")->newSubscription($this->group,$pricing_plan,
            $balance,$start_date->sub(($this->date_interval)), $end_date, $auto_withdrawal, $auto_renew, $balance);

        //Ajout autres utilisateurs au groupe
        for($i=1;$i<$nb_total_users;$i++){
            $this->addMember($i."benoit.tallandier@telecomnancy.net", $i."Benoit", "lulu", $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("name" => $this->workspace_name)));
        }
    }


    public function exec($mode='w'){
        $this->fp = fopen('file.csv', $mode);
        fputcsv($this->fp,array("day","current_cost","estimated_cost","check_end_period","overusing_or_not",
            "overCost", "balance", "balance_consumed", "expected_cost", "is_blocked","lock_date"));
        fclose($this->fp);
        $csv = array();
        $days = $this->date_interval->d;
        for ($i = 1; $i <= $days; $i++) {
            $csv = $this->DayByDayScenario($this->list_freq, $i, $this->group_id, $csv);
        }

        $this->EndScenario($this->fp,$csv);

    }

    private function increaseConnectionsPeriodForAllUsers($list,$day){
        for ($i = 0; $i < count($list); $i++) {
            $group = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupUser")->findOneBy(Array("user" => $i + 1));
            if ($group == null)
                break;
            if (($day % $list[$i]) == 0) {
                $group->increaseConnectionsPeriod();
                $this->doctrine->persist($group);
            }
        }
    }

    public function forwardOneDay($gp){
        //Group_period

        //Décale date de début de group_period
        $startAt = $gp->getPeriodStartedAt();
        $startAt->sub(new \DateInterval("P1D"));
        $gp->setPeriodStartedAt($startAt);
        $this->doctrine->persist($gp);

        //Décale date de fin de group_period
        $periodExpectedToEndAt = $gp->getPeriodExpectedToEndAt();
        $periodExpectedToEndAt->sub(new \DateInterval("P1D"));
        $gp->setPeriodExpectedToEndAt($periodExpectedToEndAt);
        $this->doctrine->persist($gp);

        //Décale date de début d'abonnement
        $startDate = $this->subscription->getStartDate();
        $startDate->add(new \DateInterval("P1D"));
        $this->subscription->setStartDate($startDate);
        $this->doctrine->persist($this->subscription);

        //Décale date de fin d'abonnement
        $endDate = $this->subscription->getEndDate();
        $endDate->add(new \DateInterval("P1D"));
        $this->subscription->setEndDate($endDate);
        $this->doctrine->persist($this->subscription);

        $this->doctrine->flush();

        return [$endDate,$periodExpectedToEndAt];
    }

    public function cronExec($group_id){
        //Récupère end_period et code de overusing
        $this->services->myGet("app.pricing_plan")->dailyDataGroupUser();
        $this->services->myGet("app.pricing_plan")->groupPeriodUsage();
        $checkEndPeriodByGroup = $this->services->myGet("app.subscription_manager")->checkEndPeriodByGroup($group_id);
        $checkOverusingByGroup = $this->services->myGet("app.subscription_manager")->checkOverusingByGroup($group_id);
        $this->services->myGet("app.subscription_manager")->checkLocked();
        return [$checkEndPeriodByGroup, $checkOverusingByGroup];
    }

    public function DayByDayScenario($list, $day, $group_id, $csv){
        $this->increaseConnectionsPeriodForAllUsers($list,$day);

        //Ajout d'un utilisateur tous les jours
        /*if($day < 30) {
            $this->addUserToList($day . "romaric.t" . "@twakeapp.com", $day . "romaric", $day . "blabla", 1);
        }*/

        $gp = $this->services->myGet("app.subscription_system")->getGroupPeriod($group_id);

        $a = $this->forwardOneDay($gp);
        $endDate = $a[0];
        $periodExpectedToEndAt = $a[1];

        $gp_saved = null;
        if($periodExpectedToEndAt->format('d') === (new \DateTime('now'))->format('d')){
            $gp_saved = clone $gp;
        }

        $a = $this->cronExec($group_id);

        $checkEndPeriodByGroup = $a[0];
        var_dump($checkEndPeriodByGroup);
        $checkOverusingByGroup = $a[1];

        /*$closed_gp = $this->doctrine->getRepository("TwakeWorkspacesBundle:ClosedGroupPeriod")->findOneBy(Array("group" => $group_id));
        if ($gp_saved != null){
            //var_dump($gp_saved);
            //var_dump("Attention le suivant arrive");
            //var_dump($closed_gp);
            $isEquivalentTo = $gp_saved->isEquivalentTo($closed_gp);
            $this->services->isEquivalentTo($isEquivalentTo);

        }*/

        //Récupère le coût de dépassement dans le cas où il y en a
        $overCost = 0;
        if ($checkOverusingByGroup !=12 && $checkOverusingByGroup != 11){
            $overCost = $this->services->myGet("app.subscription_system")->getOverCost($group_id);
        }

        //coût actuel, estimation du coût et coût attendu
        $gp_current_cost = $gp->getCurrentCost();
        $gp_estimated_cost = $gp->getEstimatedCost();
        $gp_expected_cost = $gp->getExpectedCost();

        //en cas de prélèvement non automatisé et de gros dépassement : décale lockDate
        if($checkOverusingByGroup == 9) {
            $groupIdentityRepo = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity");
            $identity = $groupIdentityRepo->findOneBy(Array("group" => $group_id));
            $newLockDate = clone $endDate;
            $identity->setLockDate($newLockDate->add(new \DateInterval("P5D")));
            $this->doctrine->persist($identity);
        }

        //Date de blocage (gros dépassement)
        $lock_date_tmp = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity")->findOneBy(Array("group" => $group_id))->getLockDate();
        if ($lock_date_tmp != null){
            $lock_date = $lock_date_tmp->format('Y-m-d');
        }else{
            $lock_date = null;
        }

        //est bloqué : facture non payée, abonnement non renouvelé,...
        $is_blocked = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group")->findOneBy(Array("id" => $group_id))->getIsBlocked();

        //Solde et solde consommé
        $subcription2 = $this->services->myGet("app.subscription_system")->get($group_id);
        $balance = $subcription2->getBalance();
        $balance_consumed = $this->services->myGet("app.subscription_system")->getCorrectBalanceConsumed($group_id);

        //en cas de prélèvement non automatisé et de gros dépassement : paiement 5 jours après
        if($checkOverusingByGroup == 9){
            $this->day_over_cost = $day;
        }
        if (($this->day_over_cost +5) == $day){
            $this->services->myGet("app.subscription_manager")->payOverCost($group_id, $this->subscription);
        }

        //changement de pricing plan
        /*if ($day == 10){
            $balance = $this->new_pricing_plan->getMonthPrice()*$this->nb_total_users;
            $this->services->myGet("app.subscription_manager")->renew($this->group, $this->new_pricing_plan, $balance, new \DateTime('now'), $endDate, $this->auto_withdrawal, $this->auto_renew, $balance, true);
        }*/

        //ajout au csv
        $line_csv = array($day, $gp_current_cost, $gp_estimated_cost,$checkEndPeriodByGroup,$checkOverusingByGroup,
            $overCost, $balance, $balance_consumed, $gp_expected_cost, $is_blocked, $lock_date);

        $this->fp = fopen('file.csv', 'a');
        fputcsv($this->fp, $line_csv);
        fclose($this->fp);


        $this->doctrine->flush();
        return $csv;
    }


    public function EndScenario($csv){
        $this->services->myGet("app.pricing_plan")->dailyDataGroupUser();
        $this->services->myGet("app.pricing_plan")->groupPeriodUsage();
    }

    public function addMember($user_mail, $pseudo, $password, $workspace_id){
        $token = $this->services->myGet("app.user")->subscribeMail($user_mail);
        $user = $this->services->myGet("app.user")->subscribe($token, null, $pseudo, $password, true);

        $this->services->myGet("app.workspace_members")->addMember($workspace_id, $user->getId(), false, null, null);
    }


    public function changeFreq($freq, $user_id){
        $this->list_freq[$user_id -1] = $freq;
    }


    public function addUserToList($user_mail, $pseudo, $password, $freq){
        $this->addMember($user_mail, $pseudo, $password, $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("name" => $this->workspace_name)));
        array_push($this->list_freq,$freq);
        $this->nb_total_users = $this->nb_total_users + 1;

    }

}