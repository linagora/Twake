<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 14/06/18
 * Time: 14:02
 */

namespace WebsiteApi\PaymentsBundle\Services;


class Billing extends BillingInterface{

    var $mailer;

    public function __construct($doctrine, $mailer)
    {
        $this->doctrine = $doctrine;
    }

    public function recordTransaction($group, $pricingPlan, $period, $startDateOfService, $groupPricingInstance){
        $issueDate = new \DateTime();
        $transaction = new Billing($issueDate,$startDateOfService,$group, $pricingPlan,$period,$groupPricingInstance);
        $id = $transaction->getId();
        $billId = "Web-".$id;
        $transaction->setBillId($billId);
        $this->doctrine->persist($transaction);
        $this->doctrine->flush();

        return $transaction->getAsArray();
    }

}