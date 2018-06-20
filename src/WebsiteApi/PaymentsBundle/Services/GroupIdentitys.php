<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 19/06/18
 * Time: 17:21
 */

namespace  WebsiteApi\PaymentsBundle\Services;

use WebsiteApi\PaymentsBundle\Entity\GroupIdentity;
use WebsiteApi\PaymentsBundle\Model\GroupIdentityInterface;

class GroupIdentitys implements GroupIdentityInterface
{
    var $doctrine;

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function create($group, $billingAdress, $adress, $mail, $phoneNumber)
    {

        $group = new GroupIdentity($group, $billingAdress, $adress, $mail, $phoneNumber);

        $this->doctrine->persist($group);
        $this->doctrine->flush();
        return $group;

    }



}