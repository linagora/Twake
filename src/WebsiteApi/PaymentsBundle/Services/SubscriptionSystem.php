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

    public function convertToEntity($var, $repository)
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

        $subscription = $subscriptionRepo->findLastActiveSub($group);

        return $subscription;
    }

    public function getAll(){
        $subscriptionRepo = $this->doctrine->getRepository("TwakePaymentsBundle:Subscription");

        return $subscriptionRepo->findBy(array(), array('startDate' => 'DESC'));
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

    public function setAutoWithdrawal($group, $autoWithdrawal)
    {
        $sub = $this->get($group);

        if($sub) {
            $sub->setAutoWithdrawal($autoWithdrawal);
            $this->doctrine->persist($sub);
            $this->doctrine->flush();
        }

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

        $gp = $this->getGroupPeriod($group);
        $gp->setExpectedCost($balance);

        $groupIdentityRepo = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity");
        $identity = $groupIdentityRepo->findOneBy(Array("group" => $group));
        $identity->setHaveAlreadySendIsOverUsingALotMail(false);
        $identity->setHaveAlreadySendIsOverUsingALittleMail(false);
        $identity->setHaveAlreadySendWillBeOverUsingMail(false);

        $this->doctrine->persist($gp);
        $this->doctrine->persist($group);
        $this->doctrine->persist($newSub);
        $this->doctrine->persist($identity);
        $this->doctrine->flush();

        //var_dump("create");
        //var_dump($gp->getExpectedCost());

        return $newSub;
    }

    public function getPricingPlans(){
        return $this->doctrine->getRepository("TwakeWorkspacesBundle:PricingPlan")->findBy(Array());
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

        $this->doctrine->persist($sub);
        $this->doctrine->flush();

    }
    public function addBalance($value, $group)
    {
        $sub = $this->get($group);
        $sub->addBalance($value);

        $this->doctrine->persist($sub);
        $this->doctrine->flush();
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

    public function testChangeLockDate($group){
        $groupIdentityRepo = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity");
        $identity = $groupIdentityRepo->findOneBy(Array("group"=>$group));

        if($identity==null)
            return false;

        $lockDate = new \DateTime();
        //$fiveDays= new \DateInterval("P5D");
        //$lockDate->sub($fiveDays);

        $identity->setLockDate($lockDate);
        return $identity->getLockDate();
    }

    public function checkLockDate($group){

        $groupIdentityRepo = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity");
        $identity = $groupIdentityRepo->findOneBy(Array("group"=>$group));

        if($identity==null)
            return false;

        return $identity->getLockDate();
    }

    public function getGroupPeriod($group){
        $groupPeriodRepo = $this->doctrine->getRepository("TwakeWorkspacesBundle:GroupPeriod");

        return  $groupPeriodRepo->getLastGroupPeriod($group);
    }

    public function getExpectedUserCount($group){
        $group = $this->convertToEntity($group,"TwakeWorkspacesBundle:Group");
        $sub = $this->get($group);
        return $sub->getBalance()/$sub->getPricingPlan()->getMonthPrice();
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

        if($delta===false)
            throw new GroupNotFoundExecption();

        if($delta>=0)
            return false;

        $delta *= -1;

        return $delta < 1000;
    }

    public function getOverCost($group){
        $delta = $this->getRemainingBalance($group);

        if($delta===false)
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

        if($delta===false)
            throw new GroupNotFoundExecption();

        if($delta>=0)
            return false;

        $delta *= -1;

        return $delta >=1000;
    }

    public function getEndPeriodTimeLeft($group)
    {
        $sub = $this->get($group);
        //var_dump("getEndPeriod");
        //var_dump($sub->getEndDate());
        return $sub->getEndDate()->diff(new \DateTime());
    }
}