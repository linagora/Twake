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
 *  */
class SubscriptionManagerSystem implements SubscriptionManagerInterface
{
    var $doctrine;
    var $subscriptionSystem;
    var $mailSender;
    var $billing;
    var $pdfBuilder;

    public function __construct($doctrine, $subscriptionSystem, $mailSender, $billing, $pdfBuilder)
    {
        $this->doctrine = $doctrine;
        $this->subscriptionSystem = $subscriptionSystem;
        $this->mailSender = $mailSender;
        $this->billing = $billing;
        $this->pdfBuilder = $pdfBuilder;
    }

    public function newSubscription($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew, $cost)
    {
        $sub = $this->subscriptionSystem->create($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew);

        $this->billGroup($group,$cost, $sub);
    }

    public function checkOverusing(){
        $groupRepo = $this->doctrine->getRepository("TwakeWorkspacesBundle:Group");
        $groups = $groupRepo->findBy(Array());

        foreach ($groups as $group) {
            $this->checkOverusingByGroup($group);
        }
    }

    public function billGroup($group, $cost, $sub)
    {        //var_dump($this->subscriptionSystem->getAutoWithdrawal($group));
        if ($this->subscriptionSystem->getAutoWithdrawal($group)){
            //var_dump("send bill : ".$cost);
            $period = $this->subscriptionSystem->getGroupPeriod($group);
            $startDateOfService = $sub->getStartDate();
            $pricingPlan = $sub->getPrincingPlan();
            $endedAt = $sub->getEndAt();
            $billedType = $sub->getStartDate()->diff($endedAt)->m==1 ? "monthly" : "year";
            $bill = $this->billing->recordTransaction($group, $pricingPlan, $period, $startDateOfService, $cost, $billedType, $endedAt);

            $pdfPath = $this->pdfBuilder->makeBillPDF($bill);

            $this->mailSender->sendBill($group,Array($pdfPath));
            return 1;
        }
        else { //Cas batard
            $this->subscriptionSystem->updateLockDate($group);
            var_dump("lock and send unpaid mail");
            $this->mailSender->sendUnpaidSubscription($group);
            return 2;
        }
    }

    public function checkOverusingByGroup($group)
    {
        if ($this->subscriptionSystem->groupIsOverUsingALot($group)) {
            //var_dump("over using a lot : ".$this->subscriptionSystem->getOverCost($group));
            $this->mailSender->sendIsOverUsingALot($group,$this->subscriptionSystem->getOverCost($group));
            return 7+$this->billGroup($group, $this->subscriptionSystem->getOverCost($group), $this->subscriptionSystem->get($group));
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

        foreach ($groups as $group) {
            $this->checkEndPeriodByGroup($group);
        }
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
                $cost = $sub->getBalance()+$this->subscriptionSystem->getRemainingBalance($group);
                //var_dump("auto renew");
                return 13+$this->renew($group, $sub->getPricingPlan(), $sub->getBalance(), new \DateTime(), $endDate,$sub->getAutoWithdrawal(),$sub->getAutoRenew(),$cost);
            } else {
                //var_dump("passer en free");
                //TODO : passer en free
                return 13;
            }
        }
    }

    public function renew($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew, $cost)
    {
        //var_dump("renew");
        $this->subscriptionSystem->archive($group);
        $sub = $this->subscriptionSystem->create($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew);

        return $this->billGroup($group,$cost, $sub);
    }

    public function checkLocked()
    {
        $groupIdentityRepo = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity");
        $identities = $groupIdentityRepo->findByLockDateExpire();

        foreach ($identities as $identity){
            //TODO : passer en free
        }
    }
}