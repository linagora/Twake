<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 14/06/18
 * Time: 11:04
 */

namespace WebsiteApi\PaymentsBundle\Services;


use WebsiteApi\PaymentsBundle\Model\SubscriptionManagerInterface;

class SubscriptionManagerSystem implements SubscriptionManagerInterface
{
    var $doctrine;
    var $subscriptionSystem;

    public function __construct($doctrine, $subscriptionSystem)
    {
        $this->doctrine = $doctrine;
        $this->subscriptionSystem = $subscriptionSystem;
    }

    public function newSubscription($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew, $cost)
    {
        $this->subscriptionSystem->create($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew);
        var_dump("new sub");

        $this->billGroup($group,$cost);
    }

    public function checkOverusing(){
        $groupRepo = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $groups = $groupRepo->findBy(Array());

        foreach ($groups as $group) {
            $this->checkOverusingByGroup($group);
        }
    }

    public function billGroup($group, $cost)
    {
        var_dump($this->subscriptionSystem->getAutoWithdrawal($group));
        if ($this->subscriptionSystem->getAutoWithdrawal($group)){
            var_dump("send bill : ".$cost);
            //TODO : record transaction in billingSystem
            //TODO : makeBillPDF
            //TODO : send mail
        }
        else { //Cas batard
            $this->subscriptionSystem->updateLockDate($group);
            var_dump("lock and send unpaid mail");
            //TODO send unpaid mail
        }
    }

    public function checkOverusingByGroup($group)
    {
        if ($this->subscriptionSystem->groupIsOverUsingALot($group)) {
            var_dump("over using a lot : ".$this->subscriptionSystem->getOverCost($group));
            $this->billGroup($group, $this->subscriptionSystem->getOverCost($group));
        } else if ($this->subscriptionSystem->groupIsOverUsingALittle($group)) {
            var_dump("over using a little : ".$this->subscriptionSystem->getOverCost($group));
            //TODO : send mail

        } else if ($this->subscriptionSystem->groupWillBeOverUsing($group)) {
            var_dump("will be over using".$this->subscriptionSystem->getOverCost($group));
            //TODO : send mail
        }
        else
            var_dump("not over using");
    }

    public function checkEndPeriod()
    {
        $groupRepo = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $groups = $groupRepo->findBy(Array());

        foreach ($groups as $group) {
            $this->checkEndPeriodByGroup($group);
        }
    }

    public function checkEndPeriodByGroup($group)
    {
        $dateInterval = $this->subscriptionSystem->getEndPeriodTimeLeft($group);
        if ($dateInterval->m == 2 && $dateInterval->y == 0 && $dateInterval->d == 0){
            var_dump("mail 2 month");
            //TODO : send mail 2 month
        }
        else if ($dateInterval->m == 1 && $dateInterval->y == 0 && $dateInterval->d == 0)
        {
            var_dump("mail 1 month");
            //TODO : send mail 1 month
        }
        else if ($dateInterval->m == 0 && $dateInterval->y == 0 && $dateInterval->d == 15)
        {
            var_dump("mail 15 days");
            //TODO : send mail 15 days
        }
        else if ($dateInterval->m == 0 && $dateInterval->y == 0 && $dateInterval->d == 7)
        {
            var_dump("mail 7 days");
            //TODO : send mail 7 days
        }
        else if ($dateInterval->m == 0 && $dateInterval->y == 0 && $dateInterval->d == 1)
        {
            var_dump("mail 1 days");
            //TODO : send mail 1 days
        }
        else if ($dateInterval->m == 0 && $dateInterval->y == 0 && $dateInterval->d == 0) {
            if ($this->subscriptionSystem->getAutoRenew($group)) {
                $sub = $this->subscriptionSystem->get($group);
                $endDate = new \DateTime();
                $dateInterval = $this->subscriptionSystem->getEndDate($group)->diff($this->subscriptionSystem->getStartDate($group));
                $endDate->add($dateInterval);
                $cost = $sub->getBalance()+$this->subscriptionSystem->getRemainingBalance($group);
                var_dump("auto renew");
                $this->renew($group, $sub->getPricingPlan(), $sub->getBalance(), new \DateTime(), $endDate,$sub->getAutoWithdrawal(),$sub->getAutoRenew(),$cost);
            } else {
                var_dump("passer en free");
                //TODO : passer en free
            }
        }
    }

    public function renew($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew, $cost)
    {
        var_dump("renew");
        $this->subscriptionSystem->archive($group);
        $this->subscriptionSystem->create($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew);

        $this->billGroup($group,$cost);
    }

    public function checkLocked()
    {
        $groupIdentityRepo = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity");
        $identities = $groupIdentityRepo->findByLockDateExpire();

        foreach ($identities as $identity){
            $identity->getLockDate();
        }
    }
}