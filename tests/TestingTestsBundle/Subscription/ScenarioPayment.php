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
    var $nb_months;
    var $services;
    var $subscription;
    var $day_over_cost;
    var $auto_withdrawal;
    var $auto_renew;
    var $pricing_plan;
    var $nb_total_users;
    var $new_pricing_plan;
    var $group;
    var $events;
    var $last_payment = 0;
    var $cost = 0;
    var $workspace_name;
    var $group_name;
    var $date_interval;

    var $addUserCallback;
    var $changePricingPlanCallback;
    var $changeWithdrawalCallback;
    var $callbackMap;

    /**
     * ScenarioPayment constructor.
     */
    public function __construct($services, $user_mail, $pseudo, $password, $group_name, $workspace_name,$pricing_plan,
                                $nb_total_users, $doctrine, $nb_months,$list_freq, $auto_withdrawal, $auto_renew,
                                $events){
        $this->list_freq = $list_freq;
        $this->nb_months = $nb_months;
        $this->services = $services;
        $this->doctrine = $doctrine;
        $this->workspace_name = $workspace_name;
        $this->group_name = $group_name;
        $this->auto_renew = $auto_renew;
        $this->auto_withdrawal = $auto_withdrawal;
        $this->pricing_plan = $pricing_plan;
        $this->nb_total_users = $nb_total_users;
        $this->events = $events;
        $this->date_interval = new \DateInterval("P30D");

        //tous les callback
        $this->addUserCallback = function(ScenarioPayment $scenario, $data){
            static $i = 0;
            //var_dump("coucou je passe dans la fonction");
            $scenario->addUserToList("ben".$i."@gmail.com", "Ben".$i, "ben", $data);
            $i++;
        };
        $this->changePricingPlanCallback = function (ScenarioPayment $scenario, $data){
            $balance = $data->getMonthPrice()*$this->nb_total_users;
            $this->services->myGet("app.subscription_manager")->renew($this->group, $data, $balance, new \DateTime('now'), $scenario->subscription->getEndDate(), $this->auto_withdrawal, $this->auto_renew, $balance, true);

        };
        $this->changeWithdrawalCallback = function (ScenarioPayment $scenario, $data){
            $this->services->myGet("app.subscription_system")->setAutoWithdrawal($scenario->group, $data);
        };
        $this->changeRenewCallback = function (ScenarioPayment $scenario, $data){
            $this->services->myGet("app.subscription_system")->setAutoRenew($scenario->group, $data);
        };
        $this->changeFrequenceCallback = function (ScenarioPayment $scenario, $data){
            $this->changeFreq($data[0],$data[1]);
        };

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

        //Ajout autres utilisateurs au groupe
        for($i=1;$i<$nb_total_users;$i++){
            $this->addMember($i."benoit.tallandier@telecomnancy.net", $i."Benoit", "lulu", $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("name" => $this->workspace_name)));
        }

        //Création abonnement
        $end_date =  (new \DateTime('now'))->sub(($this->date_interval));
        $start_date = (new \DateTime('now'))->sub(($this->date_interval));
        $this->subscription = $this->services->myGet("app.subscription_manager")->newSubscription($this->group,$pricing_plan,
            $balance,$start_date->sub(($this->date_interval)), $end_date, $auto_withdrawal, $auto_renew, $balance);

        //
        $this->callbackMap=[];
        $this->callbackMap["addUser"] = $this->addUserCallback;
        $this->callbackMap["changePricingPlan"] = $this->changePricingPlanCallback;
        $this->callbackMap["changeWithdrawal"] = $this->changeWithdrawalCallback;
        $this->callbackMap["changeRenew"] = $this->changeRenewCallback;
        $this->callbackMap["changeFrequence"] = $this->changeFrequenceCallback;
    }


    public function exec(){
        for ($i=0; $i<$this->nb_months;$i++) {
            if ($i == 0) {
                $this->execMonthly();
            }else{
                $this->execMonthly('a');
            }
        }
    }

    public function execMonthly($mode='w'){
        $now = date_format(new \DateTime('now'), 'Y-m-d');
        //var_dump($now);
        $endDate = $this->subscription->getEndDate();
        //var_dump($endDate);
        $startDate = $this->subscription->getStartDate();
        if (date_format($endDate, 'Y-m-d') == $now){
            $this->subscription = $this->services->myGet("app.subscription_system")->get($this->group);
            //var_dump($this->subscription->getId());
            $this->subscription->setEndDate($endDate->sub($this->date_interval));
            $this->subscription->setStartDate($startDate->sub($this->date_interval));
            $this->doctrine->persist($this->subscription);
            $this->doctrine->flush();
        }

        $this->fp = fopen('file.csv', $mode);

        $estimation_scenario = array();
        $estimation_scenario = $this->estimation();
        fputcsv($this->fp,$estimation_scenario);

        fputcsv($this->fp,array("day","current_cost","estimated_cost","check_end_period","overusing_or_not",
            "overCost", "balance", "balance_consumed", "expected_cost", "is_blocked","lock_date", "id_facture","cost"));
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
        //var_dump("start date");
        //var_dump(date_format($startAt, 'Y-m-d H:i:s'));

        //Décale date de fin de group_period
        $periodExpectedToEndAt = $gp->getPeriodExpectedToEndAt();
        $periodExpectedToEndAt->sub(new \DateInterval("P1D"));
        $gp->setPeriodExpectedToEndAt($periodExpectedToEndAt);
        $this->doctrine->persist($gp);
        //var_dump("expected to end at");
        //var_dump(date_format($periodExpectedToEndAt, 'Y-m-d H:i:s'));

        //Décale date de début d'abonnement
        $startDate = $this->subscription->getStartDate();
        $startDate->add(new \DateInterval("P1D"));
        $this->subscription->setStartDate($startDate);
        $this->doctrine->persist($this->subscription);
       // var_dump("start Date");
       // var_dump(date_format($startDate, 'Y-m-d H:i:s'));

        //Décale date de fin d'abonnement
        $endDate = $this->subscription->getEndDate();
        $endDate->add(new \DateInterval("P1D"));
        $this->subscription->setEndDate($endDate);
        $this->doctrine->persist($this->subscription);
        //var_dump("end Date");
        //var_dump(date_format($endDate, 'Y-m-d H:i:s'));

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


        if(isset($this->events[$day])){
            //var_dump("OuhOuh je suis ici");
            foreach ($this->events[$day]["callback"] as $key => $callback){
                ($this->callbackMap[$callback])($this,$this->events[$day]["data"][$key]);
            }
            //var_dump("after callback");
        }

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

        //en cas de prélèvement automatisé et de gros dépassement : paiement 5 jours après
        /*if($checkOverusingByGroup == 9){
            $this->day_over_cost = $day;
        }
        if (($this->day_over_cost +5) == $day){
            $this->services->myGet("app.subscription_manager")->payOverCost($group_id, $this->subscription);
        }*/

        //Affiche id et prix de la facture dans le csv
        //var_dump("Avant test");
        $id = $this->doctrine->getRepository("TwakePaymentsBundle:Receipt")->findOneBy(Array(),Array("id"=>"DESC"));
        $cost = $id->getGroupPricingInstance()->getCost();
        $id = $id->getId();
        //var_dump($cost);
        //var_dump($id);
        if ($id > $this->last_payment){
            $this->last_payment = $id;
            $this->cost = $cost;

            //ajout au csv
            $line_csv = array($day, $gp_current_cost, $gp_estimated_cost,$checkEndPeriodByGroup,$checkOverusingByGroup,
                $overCost, $balance, $balance_consumed, $gp_expected_cost, $is_blocked, $lock_date, $this->last_payment, $this->cost);

        }else {
            //ajout au csv
            $line_csv = array($day, $gp_current_cost, $gp_estimated_cost,$checkEndPeriodByGroup,$checkOverusingByGroup,
                $overCost, $balance, $balance_consumed, $gp_expected_cost, $is_blocked, $lock_date);

        }
        //var_dump($this->last_payment);
        //var_dump("Après test");


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




    public function estimation(){
        $list = $this->list_freq;
        $nb_users = count($list);
        $pricing_plan = $this->pricing_plan;
        $price_monthly = $pricing_plan->getMonthPrice();
        $price_yearly = $pricing_plan->getYearPrice();
        $group_name = $this->group_name;

        //renouvellement automatique ou non
        $renew_init = $this->auto_renew;
        $renew = $this->auto_renew;

        //prélèvement automatique ou non
        $withdraw_init = $this->auto_withdrawal;
        $withdraw = $this->auto_withdrawal;

        //estimation du prix mensuel et annuel au moment de l'inscription
        $price_monthly_for_all = $price_monthly * $nb_users;
        $price_yearly_for_all = $price_yearly * $nb_users;

        //on récupère les events
        $events = $this->events;
        $addUsers = Array();
        $changeFrequence = Array();
        $changePricingPlan = Array();
        $changeWithdraw = Array();
        $changeRenew = Array();
        foreach ($events as $i => $event){
            for ($k=0;$k<count($events[$i]["callback"]);$k++){
                if($events[$i]["callback"][$k] == "addUser"){
                    $addUsers[$i] = $events[$i]["data"];
                }
                if($events[$i]["callback"][$k] == "changeFrequence"){
                    $changeFrequence[$i] = $events[$i]["data"];
                }
                if($events[$i]["callback"][$k] == "changePricingPlan"){
                    $changePricingPlan[$i] = $events[$i]["data"];
                }
                if($events[$i]["callback"][$k] == "changeRenew"){
                    $changeRenew = $events[$i]["data"];
                }
                if($events[$i]["callback"][$k] == "changeWithdrawal") {
                    $changeWithdraw = $events[$i]["data"];
                }
            }
        }

        //on change les valeurs de fréquence dans la liste
        foreach ($changeFrequence as $i => $item){
            for ($l=0; $l<count($item);$l++){
                //var_dump($item[$l][0]);
                //var_dump($item[$l][1]);
                $freq = $item[$l][0];
                $id_user = $item[$l][1];
                $list[$id_user] = $freq;
            }
        }

        //on compte le nombre d'utilisateurs total, partiel et autre
        $user_total = 0;
        $user_partial = 0;
        $other = 0;
        for ($j=0;$j<count($list);$j++){
            if ($list[$j] == 1 || $list[$j] == 2){
                $user_total ++;
            }else if ($list[$j] == 0){
                $other++;
            }else{
                $user_partial++;
            }
        }

        //on regarde si les utilisateurs ajoutés sont des utilisateurs total, partiels ou autres
        foreach ($addUsers as $i => $addUser){
            for ($k=0;$k<count($addUser);$k++) {
                //var_dump("freq ");
                //var_dump($addUser[$k]);
                $freq = (30-$i)/$addUser[$k];
                if ($freq>10){
                    $user_total++;
                }else if ($freq == 0){
                    $other++;
                }else{
                    $user_partial++;
                }
            }
        }

        //changement de pricing plan
        foreach ($changePricingPlan as $i =>$item) {
            for ($k=0;$k<count($item);$k++) {
                $price_monthly = $item[$k]->getMonthPrice();
                $price_yearly = $item[$k]->getYearPrice();
            }
        }

        //changement sur le renouvellement
        foreach ($changeRenew as $i => $item){
            for ($l=0; $l<count($item);$l++) {
                $renew = $item;
            }
        }

        //changement sur le prélèvement
        foreach ($changeWithdraw as $i => $item){
            for ($l=0; $l<count($item);$l++) {
                $withdraw = $item;
            }
        }

        $balance_consummed_end_month = $user_total * $price_monthly + $user_partial * 0.5 * $price_monthly;
        $balance_consummed_end_year = $user_total * $price_yearly + $user_partial * 0.5 * $price_yearly;

        //prix au moment de l'abonnement
        //var_dump($price_monthly_for_all);
        //var_dump($price_yearly_for_all);

        //renouvellement
        //var_dump($renew);
        if ($renew_init){
            $renew_for_csv = "auto renew";
        }else{
            $renew_for_csv = "no auto renew";
        }

        //prélèvement
        //var_dump($withdraw);
        if ($withdraw_init){
            $withdraw_for_csv = "auto withdraw";
        }else{
            $withdraw_for_csv = "no auto withdraw";
        }

        //nombre d'utilisateurs
  /*      var_dump("total ".$user_total);
        var_dump("partial ".$user_partial);
        var_dump("other ".$other);
*/
        //prix
        //var_dump($balance_consummed_end_month);
        //var_dump($balance_consummed_end_year);

        $estimation_scenario = array("Group name",$group_name,"first price monthly", $price_monthly_for_all, "first price yearly", $price_yearly_for_all,
            $renew_for_csv,$withdraw_for_csv, "nb users total", $user_total, "nb users partial", $user_partial, "other users",
            $other,"balance consummed end of month",$balance_consummed_end_month,"balance consummed end of year",$balance_consummed_end_year);

        return $estimation_scenario;
    }

}