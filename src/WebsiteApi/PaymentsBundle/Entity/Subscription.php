<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 13/06/18
 * Time: 14:16
 */

namespace WebsiteApi\PaymentsBundle\Entity;

use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\PricingPlan;

/**
 * Class Subscription
 * @package WebsiteApi\PaymentsBundle\Entity
 * @ORM\Table(name="subscription",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\PaymentsBundle\Repository\SubscriptionRepository")
 */
class Subscription
{
    /**
     * Entity : subscription_entity (id,group_id, pricing_plan_id, balance , balance_consumed, start_date, end_date, prével auto, renouvellemnt auto)
     */
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
 */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
     */
    private $group;


    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\PricingPlan")
     */
    private $pricingplan;

    /**
     * @ORM\Column(type = "integer")
     */
    private $balance;

    /**
     * @ORM\Column(type="integer")
     */
    private $balanceconsumed = 0;
    /**
     * @ORM\Column(type="integer")
     */
    private $subscribedbalance = 0;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $startdate;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $enddate;

    /**
     * @ORM\Column(type = "boolean")
     */
    private $autowithdrawal;
    /**
     * @ORM\Column(type = "boolean")
     */
    private $autorenew;

    /**
     * @ORM\Column(type = "boolean")
     */
    private $archived = false;

    /**
     * Subscription constructor.
     * @param $group_id
     * @param $pricing_plan_id
     * @param $balance
     * @param $start_date
     * @param $end_date
     * @param $auto_withdrawal
     * @param $auto_renew
     */
    public function __construct($group, $pricingplan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew)
    {
        $this->group = $group;
        $this->pricingplan = $pricingplan;
        $this->balance = $balance;
        $this->subscribedbalance = $balance;
        $this->startdate = $start_date;
        $this->enddate = $end_date;
        $this->autowithdrawal = $auto_withdrawal;
        $this->autorenew = $auto_renew;
    }


    /**
     * @return mixed
     */
    public function getArchived()
    {
        return $this->archived;
    }

    /**
     * @param mixed $archived
     */
    public function setArchived($archived)
    {
        $this->archived = $archived;
    }

    /**
     * @return mixed
     */
    public function getGroup()
    {
        return $this->group;
    }

    /**
     * @param mixed $group_id
     */
    public function setGroup($group)
    {
        $this->group_id = $group;
    }

    /**
     * @return mixed
     */
    public function getPricingPlan()
    {
        return $this->pricingplan;
    }

    /**
     * @param mixed $pricing_plan_id
     */
    public function setPricingPlan($pricing_plan)
    {
        $this->pricingplan = $pricing_plan;
    }

    /**
     * @return mixed
     */
    public function getBalance()
    {
        return $this->balance;
    }

    /**
     * @param mixed $balance
     */
    public function setBalance($balance)
    {
        $this->balance = $balance;
    }

    /**
     * @return mixed
     */
    public function getBalanceConsumed()
    {
        return $this->balanceconsumed;
    }

    /**
     * @param mixed $balance_consumed
     */
    public function setBalanceConsumed($balance_consumed)
    {
        $this->balanceconsumed = $balance_consumed;
    }

    public function addBalanceConsumed($balance_consumed)
    {
        $this->balanceconsumed += $balance_consumed;
    }


    public function addBalance($balance)
    {
        $this->balance += $balance;
    }

    /**
     * @return mixed
     */
    public function getStartDate()
    {
        return $this->startdate;
    }

    /**
     * @param mixed $startdate
     */
    public function setStartDate($startdate)
    {
        $this->startdate = $startdate;
    }

    /**
     * @return mixed
     */
    public function getEndDate()
    {
        return $this->enddate;
    }

    /**
     * @param mixed $enddate
     */
    public function setEndDate($enddate)
    {
        $this->enddate = $enddate;
    }

    /**
     * @return mixed
     */
    public function getAutoWithdrawal()
    {
        return $this->autowithdrawal;
    }

    /**
     * @param mixed $autowithdrawal
     */
    public function setAutoWithdrawal($autowithdrawal)
    {
        $this->autowithdrawal = $autowithdrawal;
    }

    /**
     * @return mixed
     */
    public function getAutoRenew()
    {
        return $this->autorenew;
    }

    /**
     * @param mixed $autorenew
     */
    public function setAutoRenew($autorenew)
    {
        $this->autorenew = $autorenew;
    }


    /**
     * @return mixed
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    public function getId()
    {
        return $this->id;
    }


    public function getAsArray() {

        return Array(
            "id" => $this->getId(),
            "group" => $this->getGroup()->getAsArray(),
            "pricingPlan" => $this->getPricingPlan()->getAsArray(),
            "startDate" => $this->getStartDate()->getTimestamp(),
            "endDate" => $this->getEndDate()->getTimestamp(),
            "balance" => $this->getBalance(),
            "balanceConsumed" => $this->getBalanceConsumed(),
            "autoRenew" => $this->getAutoRenew(),
            "autoWithdrawable" => $this->getAutoWithdrawal(),
            "archived" => $this->getArchived()
        );
    }

    /**
     * @return mixed
     */
    public function getSubscribedBalance()
    {
        return $this->subscribedbalance;
    }
}