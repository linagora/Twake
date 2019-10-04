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

class Billing implements BillingInterface
{

    var $doctrine;

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function recordTransaction($group, $pricingPlan, $period, $startDateOfService, $cost, $billedType, $endedAt)
    {
        $grouppricinginstance = new GroupPricingInstance($group, $billedType, $pricingPlan);

        $grouppricinginstance->setCost($cost);
        $grouppricinginstance->setStartedAt($startDateOfService);
        $grouppricinginstance->setEndAt($endedAt);

        $issueDate = new \DateTime();

        $groupIdentity = $this->doctrine->getRepository("TwakePaymentsBundle:GroupIdentity")->findOneBy(Array("group" => $group));

        $transaction = new Receipt($issueDate, $startDateOfService, "null", $groupIdentity, $pricingPlan, $grouppricinginstance, $period);

        $this->doctrine->persist($transaction);
        $this->doctrine->flush();

        $transaction = $this->doctrine->getRepository("TwakePaymentsBundle:Receipt")->findOneBy(Array("billId" => "null"));

        $id = $transaction->getId();
        $billId = "Web-" . $id;

        $transaction->setBillId($billId);

        $this->doctrine->persist($transaction);
        $this->doctrine->flush();

        return $transaction->getAsArray();
    }

    public function getAllReceipt()
    {
        $subscriptionRepo = $this->doctrine->getRepository("TwakePaymentsBundle:Receipt");

        return $subscriptionRepo->findBy(array(), array('startDateOfService' => 'DESC'));
    }

}