<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 14/06/18
 * Time: 11:04
 */

namespace WebsiteApi\PaymentsBundle\Services;


use WebsiteApi\PaymentsBundle\Model\SubscriptionManagerInterface;

/*Return code
 * 1 : bill mail
 * 2 : unpaid mail
 * 3 : 2 month left
 * 4 : 1 month left
 * 5 : 15 days left
 * 6 : 7 days left
 * 7 : 1 day left
 * 8 : sendIsOverUsingALot and bill mail
 * 9 : sendIsOverUsingALot and unpaid mail
 * 10 : sendIsOverUsingALittle
 * 11 : groupWillBeOverUsing
 * 12 : not over using
 * 13 : passer en free
 * 14 : auto renew and bill mail
 * 15 : auto renew and unpaid mail
 * 16 : lock date set
 *  */
class SubscriptionManagerSystem implements SubscriptionManagerInterface
{
    var $doctrine;
    var $subscriptionSystem;
    var $mailSender;
    var $billing;
    var $pdfBuilder;
    var $groups;
    var $groupApps;

    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = intval($var);
        }

        if (is_int($var)) {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }

    public function __construct($doctrine, $subscriptionSystem, $mailSender, $billing, $pdfBuilder, $groups, $groupApps){
        $this->doctrine = $doctrine;
        $this->subscriptionSystem = $subscriptionSystem;
        $this->mailSender = $mailSender;
        $this->billing = $billing;
        $this->pdfBuilder = $pdfBuilder;
        $this->groups = $groups;
        $this->groupApps = $groupApps;
    }

    public function newSubscription($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew, $cost)
    {
        $group = $this->convertToEntity($group,"TwakeWorkspacesBundle:Group");
        if($group==null)
            return -1;
        $sub = $this->subscriptionSystem->create($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew);
        //var_dump(73);
        //var_dump($this->subscriptionSystem->getGroupPeriod($group)->getExpectedCost());
        $this->billGroup($group,$cost, $sub, true);
        //var_dump(76);
        //var_dump($this->subscriptionSystem->getGroupPeriod($group)->getExpectedCost());
        return $sub ;
    }

    public function checkOverusing(){
        $groupRepo = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $groups = $groupRepo->findBy(Array());

        $res = array();

        foreach ($groups as $group) {
            $res[$group->getId()] = $this->checkOverusingByGroup($group);
        }

        return $res;
    }

    public function billGroup($group, $cost, $sub, $alreadyPaied)
    {
        $group = $this->convertToEntity($group,"TwakeWorkspacesBundle:Group");
        //var_dump($this->subscriptionSystem->getAutoWithdrawal($group));
        if ($this->subscriptionSystem->getAutoWithdrawal($group) || $alreadyPaied){
            $groupIdentityRepo = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity");
            $identity = $groupIdentityRepo->findOneBy(Array("group" => $group));
            $identity->setLockDate(null);
            $this->doctrine->persist($identity);
            $this->doctrine->flush();

            //var_dump("send bill : ".$cost);
            $period = $this->subscriptionSystem->getGroupPeriod($group);
            $startDateOfService = $sub->getStartDate();
            $pricingPlan = $sub->getPricingPlan();
            $endedAt = $sub->getEndDate();
            $billedType = $sub->getStartDate()->diff($endedAt)->m==1 ? "monthly" : "year";
            //var_dump(106);
            //var_dump($this->subscriptionSystem->getGroupPeriod($group)->getExpectedCost());
            $bill = $this->billing->recordTransaction($group, $pricingPlan, $period, $startDateOfService, $cost, $billedType, $endedAt);
            //var_dump(108);
            //var_dump($this->subscriptionSystem->getGroupPeriod($group)->getExpectedCost());
            //stats
            $apps = $this->groupApps->getApps($group);

            $groupPeriodRepo = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupPeriod");
            $groupPeriod = $groupPeriodRepo->getLastGroupPeriod($group);


            $users_number = Array(
                "users_number" => $this->groups->countUsersGroup($group),
                "group_id" => $groupPeriod->getGroup()->getId(),
                "group_name" => $groupPeriod->getGroup()->getName()
            );

            $list = array();
            foreach ($apps as $app){
                if (count($groupPeriod->getAppsUsagePeriod()) != 0){
                    if(!$groupPeriod->getAppsUsagePeriod()[$app->getApp()->getId()]){
                        continue;
                    }
                    $element = array(
                        "app" => $app->getApp()->getAsArray(),
                        "usage" => $groupPeriod->getAppsUsagePeriod()[$app->getApp()->getId()],
                    );
                    $list[] = $element;
                }

            }

            $pdfStat = $this->pdfBuilder->makeUsageStatPDF(Array(
                "list" => $list,
                "connexion" => $groupPeriod->getConnexions(),
                "stat_id" => $bill["id"],
                "group_id" => $groupPeriod->getGroup()->getId(),
                "group_name" => $groupPeriod->getGroup()->getName()
            ));

            //bill
            $pdfPath = $this->pdfBuilder->makeBillPDF(array_merge($bill, $users_number));

            $this->mailSender->sendBill($group,Array($pdfPath,$pdfStat));
            return 1;
        }
        else { //Cas batard
            $this->subscriptionSystem->updateLockDate($group);
            //var_dump("lock and send unpaid mail");
            $this->mailSender->sendUnpaidSubscription($group);
            return 2;
        }
    }

    public function checkOverusingByGroup($group)
    {
        $groupIdentityRepo = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity");
        $identity = $groupIdentityRepo->findOneBy(Array("group" => $group));
        if($identity->getLockDate()!=null)
            return 16;
        if ($this->subscriptionSystem->groupIsOverUsingALot($group)) {
            //var_dump("over using a lot : ".$this->subscriptionSystem->getOverCost($group));
            $this->mailSender->sendIsOverUsingALot($group,$this->subscriptionSystem->getOverCost($group));
            $res = $this->billGroup($group, $this->subscriptionSystem->getOverCost($group), $this->subscriptionSystem->get($group), false);
            if($res==1)
                $this->subscriptionSystem->addBalance($this->subscriptionSystem->getOverCost($group),$group);
            return 7+$res;
        } else if ($this->subscriptionSystem->groupIsOverUsingALittle($group)) {
            //var_dump("over using a little : ".$this->subscriptionSystem->getOverCost($group));
            $this->mailSender->sendIsOverUsingALittle($group,$this->subscriptionSystem->getOverCost($group));
            return 10;
        } else if ($this->subscriptionSystem->groupWillBeOverUsing($group)) {
            //var_dump("will be over using".$this->subscriptionSystem->getOverCost($group));
            $this->mailSender->sendWillBeOverUsing($group,$this->subscriptionSystem->getOverCost($group));
            return 11;
        }

        return 12;
        //else
        //    var_dump("not over using");
    }

    public function checkEndPeriod()
    {
        $groupRepo = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $groups = $groupRepo->findBy(Array());
        $res = array();

        foreach ($groups as $group) {
            $res[$group->getId()] = $this->checkEndPeriodByGroup($group);
        }

        return $res;
    }

    public function checkEndPeriodByGroup($group)
    {
        $dateInterval = $this->subscriptionSystem->getEndPeriodTimeLeft($group);
        if ($dateInterval->m == 2 && $dateInterval->y == 0 && $dateInterval->d == 0){
            //var_dump("mail 2 month");
            $this->mailSender->sendEndPeriodsMail($group,"2 month");
            return 3;
        }
        else if ($dateInterval->m == 1 && $dateInterval->y == 0 && $dateInterval->d == 0)
        {
            //var_dump("mail 1 month");
            $this->mailSender->sendEndPeriodsMail($group,"1 month");
            return 4;
        }
        else if ($dateInterval->m == 0 && $dateInterval->y == 0 && $dateInterval->d == 15)
        {
            //var_dump("mail 15 days");
            $this->mailSender->sendEndPeriodsMail($group,"15 days");
            return 5;
        }
        else if ($dateInterval->m == 0 && $dateInterval->y == 0 && $dateInterval->d == 7)
        {
            //var_dump("mail 7 days");
            $this->mailSender->sendEndPeriodsMail($group,"7 days");
            return 6;
        }
        else if ($dateInterval->m == 0 && $dateInterval->y == 0 && $dateInterval->d == 1)
        {
            //var_dump("mail 1 days");
            $this->mailSender->sendEndPeriodsMail($group,"1 day");
            return 7;
        }
        else if ($dateInterval->m == 0 && $dateInterval->y == 0 && $dateInterval->d == 0) {
            if ($this->subscriptionSystem->getAutoRenew($group)) {
                $sub = $this->subscriptionSystem->get($group);
                $endDate = new \DateTime();
                $dateInterval = $this->subscriptionSystem->getEndDate($group)->diff($this->subscriptionSystem->getStartDate($group));
                $endDate->add($dateInterval);
                $cost = $sub->getSubscribedBalance()+$this->subscriptionSystem->getRemainingBalance($group);
                //var_dump("auto renew");
                return 13+$this->renew($group, $sub->getPricingPlan(), $sub->getSubscribedBalance(), new \DateTime(), $endDate,$sub->getAutoWithdrawal(),$sub->getAutoRenew(),$cost);
            } else {
                //var_dump("passer en free");
                $this->putInFree($group);
                return 13;
            }
        }
        return $dateInterval->format('%a');
    }

    public function renew($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew, $cost, $manual)
    {
        //var_dump("renew");
        $this->subscriptionSystem->archive($group);
        $sub = $this->subscriptionSystem->create($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew);

        return $this->billGroup($group,$cost, $sub, $manual);
    }

    public function checkLocked()
    {
        $groupIdentityRepo = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity");
        $identities = $groupIdentityRepo->findByLockDateExpire();

        $res = array();

        foreach ($identities as $identity){
            $this->putInFree($identity->getGroup());
            $res[$identity->getGroup()->getId()] = true;
        }

        return $res;
    }

    public function putInFree($group){
        $group = $this->convertToEntity($group,"TwakeWorkspacesBundle:Group");
        $group->setIsBlocked(true);
        $this->doctrine->persist($group);
        $this->doctrine->flush();
    }
}