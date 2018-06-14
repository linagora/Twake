<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 14/06/18
 * Time: 09:14
 */

namespace WebsiteApi\PaymentsBundle\Services;


use WebsiteApi\PaymentsBundle\Entity\Subscription;
use WebsiteApi\PaymentsBundle\Model\SubscriptionInterface;

class SubscriptionSystem implements SubscriptionInterface
{
    var $doctrine;

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function get($group){
        $subscriptionRepo = $this->doctrine->getRepository("TwakePaymentsBundle:Subscription");

        $subscription = $subscriptionRepo->findOneBy(Array( "group" => $group, "archived" => false));

        return $subscription;
    }

    public function getAutoWithdrawal($group)
    {
        $sub = $this->get($group);

        if($sub)
            $sub->getAutoWithdrawal();

        return false;
    }

    public function getAutoRenew($group)
    {
        $sub = $this->get($group);

        if($sub)
            $sub->getAutoRenew();

        return false;
    }

    public function create($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew)
    {
        $newSub = new Subscription($group,$pricing_plan,$balance,$start_date,$end_date,$auto_withdrawal,$auto_renew);

        $this->doctrine->persist($newSub);
        $this->doctrine->flush();
    }

    public function archive($group)
    {
        $sub = $this->get($group);
        $sub->setArchived(true);


        $this->doctrine->persist($sub);
        $this->doctrine->flush();
    }

    public function addBalanceConsumption($value, $group)
    {
        $sub = $this->get($group);
        $sub->addBalanceConsumed($value);
    }

    public function getRemainingBalance($group)
    {
        $sub = $this->get($group);

        if(!$sub)
            return false;

        return $sub->getBalance() - $this->getCorrectBalanceConsumed($group);
    }

    public function updateLockDate($group){
        $groupIdentityRepo = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity");
        $identity = $groupIdentityRepo->findOneBy(Array("group"=>$group));

        $lockDate = new \DateTime();
        $fiveDays= new \DateInterval("P5D");
        $lockDate->add($fiveDays);

        $identity->setLockDate($lockDate);
    }

    private function getGroupPeriod($group){
        $groupPeriodRepo = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupPeriod");

        return  $groupPeriodRepo->getLastGroupPeriod($group);
    }

    public function getCorrectBalanceConsumed($group){
        $sub = $this->get($group);
        if(!$sub)
            return false;

        $gp = $this->getGroupPeriod($group);

        return $sub->getBalanceConsumed()+$gp->getCurrentCost();
    }

    public function groupIsOverUsingALittle($group)
    {
        $delta = $this->getRemainingBalance($group);

        if(!$delta)
            throw new GroupNotFoundExecption();

        if($delta>=0)
            return false;

        $delta *= -1;

        return $delta < 1000;
    }

    public function groupWillBeOverUsing($group)
    {
        $gp = $this->getGroupPeriod($group);

        return $gp->getEstimatedCost() > $gp->getExpectedCost();
    }

    public function groupIsOverUsingALot($group)
    {
        $delta = $this->getRemainingBalance($group);

        if(!$delta)
            throw new GroupNotFoundExecption();

        if($delta>=0)
            return false;

        $delta *= -1;

        return $delta >=1000;
    }

    public function getEndPeriodTimeLeft($group)
    {
        $gp = $this->getGroupPeriod($group);

        return $gp->getPeriodStartedAt()->diff($gp->getPeriodEndedAt());
    }
}