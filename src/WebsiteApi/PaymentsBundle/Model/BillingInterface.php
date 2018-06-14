<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 13/06/18
 * Time: 14:59
 */

namespace WebsiteApi\PaymentsBundle\Model;


interface BillingInterface
{
    //@recordTransaction record a transaction in bdd
    public function recordTransaction($group, $pricingPlan, $period);

}