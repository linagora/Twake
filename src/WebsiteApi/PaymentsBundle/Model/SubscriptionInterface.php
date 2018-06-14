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
    public function get($group_id);

    // voir pour getter particulier

    // @createSubscirption create a subscription
    public function create($group_id, $pricing_plan_id, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew);

    // @archiveSubscription archive a subscription
    public function archive($group_id);

    public function addConsumed($value, $group_id);

    public function getDiff($group_id);

    public function updateLockDate($group_id);

    public function groupIsOverUsingALittle($group_id);

    public function groupWillBeOverUsing($group_id);

    public function groupIsOverUsingALot($group_id);

    public function getEndPeriodTimeLeft($group_id);

}