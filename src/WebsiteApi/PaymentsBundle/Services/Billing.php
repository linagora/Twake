<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 14/06/18
 * Time: 14:02
 */

namespace WebsiteApi\PaymentsBundle\Services;


use WebsiteApi\PaymentsBundle\Entity\Receipt;
use WebsiteApi\PaymentsBundle\Model\BillingInterface;
use WebsiteApi\WorkspacesBundle\Entity\GroupPricingInstance;

class Billing implements BillingInterface{

    var $doctrine;

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function recordTransaction($group, $pricingPlan, $period, $startDateOfService, $cost, $billedType, $endedAt){
        $groupPricingInstance = new GroupPricingInstance($group,$billedType,$pricingPlan);

        $groupPricingInstance->setCost($cost);
        $groupPricingInstance->setStartedAt($startDateOfService);
        $groupPricingInstance->setEndAt($endedAt);

        $this->doctrine->persist($groupPricingInstance);
        $this->doctrine->flush();

        $issueDate = new \DateTime();

        $groupIdentity = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity")->findOneBy(Array("group" => $group));

        $transaction = new Receipt($issueDate,$startDateOfService,"null", $groupIdentity, $pricingPlan,$groupPricingInstance,$period);

        $this->doctrine->persist($transaction);
        $this->doctrine->flush();

        $transaction = $this->doctrine->getRepository("TwakePaymentsBundle:Receipt")->findOneBy(Array("billId"=> "null"));

        $id = $transaction->getId();
        $billId = "Web-".$id;

        $transaction->setBillId($billId);

        $this->doctrine->persist($transaction);
        $this->doctrine->flush();

        return $transaction->getAsArray();
    }

}