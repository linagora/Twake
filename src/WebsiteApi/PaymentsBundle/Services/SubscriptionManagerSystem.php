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
        if ($this->subscriptionSystem->getAutoWithdrawal()){
            //TODO : record transaction in billingSystem
            //TODO : makeBillPDF
            //TODO : send mail
        }
        else { //Cas batard
            $this->subscriptionSystem->updateLockDate($group);
            //TODO send unpaid mail
        }
    }

    public function checkOverusingByGroup($group)
    {
        if ($this->subscriptionSystem->groupIsOverUsingALot($group)) {
            $this->billGroup($group, $this->subscriptionSystem->getOverCost($group));
        } else if ($this->subscriptionSystem->groupIsOverUsingALittle($group)) {
            //TODO : send mail

        } else if ($this->subscriptionSystem->groupWillBeOverUsing($group)) {
            //TODO : send mail
        }
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
        if ($dateInterval->m == 2 && $dateInterval->y == 0 && $dateInterval->d == 0)
            ;//TODO : send mail 2 month
        else if ($dateInterval->m == 1 && $dateInterval->y == 0 && $dateInterval->d == 0)
            ;//TODO : send mail 1 month
        else if ($dateInterval->m == 0 && $dateInterval->y == 0 && $dateInterval->d == 15)
            ;//TODO : send mail 15 days
        else if ($dateInterval->m == 0 && $dateInterval->y == 0 && $dateInterval->d == 7)
            ;//TODO : send mail 7 days
        else if ($dateInterval->m == 0 && $dateInterval->y == 0 && $dateInterval->d == 1)
            ;//TODO : send mail 1 days
        else if ($dateInterval->m == 0 && $dateInterval->y == 0 && $dateInterval->d == 0) {
            if ($this->subscriptionSystem->getAutoRenew()) {
                $sub = $this->subscriptionSystem->get($group);
                $endDate = new \DateTime();
                $dateInterval = $this->subscriptionSystem->getEndDate($group)->diff($this->subscriptionSystem->getStartDate($group));
                $endDate->add($dateInterval);
                $cost = $sub->getBalance()+$this->subscriptionSystem->getRemainingBalance($group);
                $this->renew($group, $sub->getPricingPlan(), $sub->getBalance(), new \DateTime(), $endDate,$sub->getAutoWithdrawal(),$sub->getAutoRenew(),$cost);
            } else
                ;//TODO : passer en free
        }
    }

    public function renew($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew, $cost)
    {
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