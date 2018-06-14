<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 14/06/18
 * Time: 11:04
 */

namespace WebsiteApi\PaymentsBundle\Model;


interface SubscriptionManagerInterface
{
    public function newSubscription($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew, $cost);

    public function checkOverusing();

    public function checkEndPeriod();

    public function renew($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew, $cost);

    public function checkLocked();
}