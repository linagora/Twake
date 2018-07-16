<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 19/06/18
 * Time: 17:37
 */

namespace WebsiteApi\PaymentsBundle\Model;


interface GroupIdentityInterface
{

    public function create($group, $billingAdress, $adress, $mail, $phoneNumber);
}