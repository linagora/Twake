<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 13/06/18
 * Time: 14:59
 */

namespace WebsiteApi\PaymentsBundle\Model;


interface SubscriptionInterface
{
    // @getSubscription returns subscription by group_id
    public function get($group);

    // voir pour getter particulier

    // @createSubscirption create a subscription
    public function create($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew);

    // @archiveSubscription archive a subscription
    public function archive($group);

    //@addBalanceConsumption
    public function addBalanceConsumption($value, $group);

    //@getDiff
    public function getRemainingBalnce($group);

    //@updateLockDate
    public function updateLockDate($group);

    //@groupIsOverUsingALittle
    public function groupIsOverUsingALittle($group);

    //@groupWillBeOverUsing
    public function groupWillBeOverUsing($group);

    //@groupIsOverUsingALot
    public function groupIsOverUsingALot($group);

    //@getEndPeriodTimeLeft
    public function getEndPeriodTimeLeft($group);

    //@getCorrectBalanceConsumed
    public function getCorrectBalanceConsumed($group);

}