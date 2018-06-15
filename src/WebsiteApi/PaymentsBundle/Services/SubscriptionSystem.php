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

    public function get($group){
        $subscriptionRepo = $this->doctrine->getRepository("TwakePaymentsBundle:Subscription");

        $subscription = $subscriptionRepo->findOneBy(Array( "group" => $group, "archived" => false));

        return $subscription;
    }

    public function getStartDate($group){
        $sub = $this->get($group);

        if($sub)
            return $sub->getStartDate();

        throw new SubscriptionNotFound();
    }


    public function getEndDate($group){
        $sub = $this->get($group);

        if($sub)
            return $sub->getEndDate();

        throw new SubscriptionNotFound();
    }

    public function getAutoWithdrawal($group)
    {
        $sub = $this->get($group);

        if($sub)
            return $sub->getAutoWithdrawal();

        throw new SubscriptionNotFound();
    }

    public function getAutoRenew($group)
    {
        $sub = $this->get($group);

        if($sub)
            return $sub->getAutoRenew();

        throw new SubscriptionNotFound();
    }

    public function create($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew)
    {
        $group = $this->convertToEntity($group,"TwakeWorkspacesBundle:Group");
        $group->setIsBlocked(false);
        $pricing_plan = $this->convertToEntity($pricing_plan,"TwakeWorkspacesBundle:PricingPlan");
        $newSub = new Subscription($group,$pricing_plan,$balance,$start_date,$end_date,$auto_withdrawal,$auto_renew);

        $this->doctrine->persist($group);
        $this->doctrine->persist($newSub);
        $this->doctrine->flush();

        return $newSub;
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

        if($identity==null)
            return false;

        $lockDate = new \DateTime();
        $fiveDays= new \DateInterval("P5D");
        $lockDate->add($fiveDays);

        $identity->setLockDate($lockDate);
    }

    public function getGroupPeriod($group){
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

    public function getOverCost($group){
        $delta = $this->getRemainingBalance($group);

        if(!$delta)
            throw new GroupNotFoundExecption();

        if($delta>=0)
            return false;

        $delta *= -1;

        return $delta;
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

        return $gp->getPeriodStartedAt()->diff($gp->getPeriodExpectedToEndAt());
    }
}