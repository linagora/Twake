<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 14/06/18
 * Time: 15:33
 */

namespace WebsiteApi\PaymentsBundle\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\PaymentsBundle\Services\SubscriptionManagerSystem;

class SubscriptionController extends Controller
{
    public function newSubscriptionAction(){
        $group = 1;
        $pricing_plan = 2;
        $balance = 1000;
        $start_date = new \DateTime();
        $end_date = (new \DateTime())->add(new \DateInterval("P1M"));
        $auto_renew = true;
        $auto_withdrawal = true;
        $cost = $balance;

        $this->get("app.subscription_manager")->newSubscription($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew, $cost);

        return new JsonResponse();
    }

    public function checkOverusingAction(){
        $this->get("app.subscription_manager")->checkOverusing();

        return new JsonResponse();
    }
    public function checkEndPeriodAction(){
        $this->get("app.subscription_manager")->checkEndPeriod();

        return new JsonResponse();
    }
}