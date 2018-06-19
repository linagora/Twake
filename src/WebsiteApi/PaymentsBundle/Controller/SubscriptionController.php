<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 14/06/18
 * Time: 15:33
 */

namespace WebsiteApi\PaymentsBundle\Controller;


use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\PaymentsBundle\Services\SubscriptionManagerSystem;

class SubscriptionController extends Controller
{
    public function newSubscriptionAction(Request $request){
        $group = $request->request->get("group");
        $pricing_plan = $request->request->get("pricing_plan");
        $balance = $request->request->get("balance");
        $start_date = $request->request->get("startDate");
        $end_date = $request->request->get("endDate");
        $auto_renew = $request->request->get("autoRenew");
        $auto_withdrawal = $request->request->get("autoWithdrawal");
        $cost = $balance;
        $data["errors"] = Array();

        if(!is_numeric($group)){
            $data["errors"][] = "group error";
            return new JsonResponse($data);
        }

        if(!is_numeric($pricing_plan)){
            $data["errors"][] = "pricing_plan error";
            return new JsonResponse($data);
        }

        if(strtotime($start_date) > strtotime($end_date)){
            $data["errors"][] = "date error";
            return new JsonResponse($data);
        }

        if( ! ($auto_withdrawal===true || $auto_withdrawal===false)){
            $data["errors"][] = "auto_withdrawal error";
            return new JsonResponse($data);
        }

        if( ! ($auto_renew===true || $auto_renew===false)){
            $data["errors"][] = "auto_renew error";
            return new JsonResponse($data);
        }

        $data["data"] = $this->get("app.subscription_manager")->newSubscription($group, $pricing_plan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew, $cost);

        return new JsonResponse($data);
    }

    public function getSubscriptionInfoAction(Request $request){
        $group = $request->request->get("groupId");

        $data["errors"] = Array();

        if(!is_numeric($group)){
            $data["errors"][] = "group error";
            return new JsonResponse($data);
        }

        $sub = $this->get("app.subscription_system")->get($group);

        if($sub==null){
            $data["errors"][] = 0;
            $data["errors"][] = "no subscription for this group";
            return new JsonResponse($data);
        }

        $data["data"] = $sub->getAsArray();

        $gp = $this->get("app.subscription_system")->getGroupPeriod($group);

        if($gp==null){
            $data["errors"][] = 0;
            $data["errors"][] = "no group period for this group";
            return new JsonResponse($data);
        }

        $data["data"] = array_merge($sub->getAsArray(), $gp->getAsArray());

        return new JsonResponse($data);
    }

    public function getPricingPlansAction(){
        $pricingPlans = $this->get("app.subscription_system")->getPricingPlans();

        $pricingPlansArray = Array();

        foreach ($pricingPlans as $pp){
            array_push($pricingPlansArray,$pp->getAsArray());
        }

        return new JsonResponse($pricingPlansArray);
    }

    public function checkOverusingAction(){
        return new JsonResponse($this->get("app.subscription_manager")->checkOverusing());
    }
    public function checkEndPeriodAction(){
        return new JsonResponse($this->get("app.subscription_manager")->checkEndPeriod());
    }
}