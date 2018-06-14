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
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
     */
    private $group;


    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\PricingPlan")
     */
    private $pricingPlan;

    /**
     * @ORM\Column(type = "integer")
     */
    private $balance;

    /**
     * @ORM\Column(type="integer")
     */
    private $balanceConsumed = 0;

    /**
     * @ORM\Column(type="datetime")
     */
    private $startDate;

    /**
     * @ORM\Column(type="datetime")
     */
    private $endDate;

    /**
     * @ORM\Column(type = "boolean")
     */
    private $autoWithdrawal;
    /**
     * @ORM\Column(type = "boolean")
     */
    private $autoRenew;

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
    public function __construct($group, $pricingPlan, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew)
    {
        $this->group = $group;
        $this->pricing_plan_id = $pricingPlan;
        $this->balance = $balance;
        $this->startDate = $start_date;
        $this->endDate = $end_date;
        $this->autoWithdrawal = $auto_withdrawal;
        $this->autoRenew = $auto_renew;
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
        return $this->pricingPlan;
    }

    /**
     * @param mixed $pricing_plan_id
     */
    public function setPricingPlan($pricing_plan)
    {
        $this->pricingPlan = $pricing_plan;
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
        return $this->balanceConsumed;
    }

    /**
     * @param mixed $balance_consumed
     */
    public function setBalanceConsumed($balance_consumed)
    {
        $this->balanceConsumed = $balance_consumed;
    }

    public function addBalanceConsumed($balance_consumed)
    {
        $this->balanceConsumed += $balance_consumed;
    }

    /**
     * @return mixed
     */
    public function getStartDate()
    {
        return $this->startDate;
    }

    /**
     * @param mixed $startDate
     */
    public function setStartDate($startDate)
    {
        $this->startDate = $startDate;
    }

    /**
     * @return mixed
     */
    public function getEndDate()
    {
        return $this->endDate;
    }

    /**
     * @param mixed $endDate
     */
    public function setEndDate($endDate)
    {
        $this->endDate = $endDate;
    }

    /**
     * @return mixed
     */
    public function getAutoWithdrawal()
    {
        return $this->autoWithdrawal;
    }

    /**
     * @param mixed $autoWithdrawal
     */
    public function setAutoWithdrawal($autoWithdrawal)
    {
        $this->autoWithdrawal = $autoWithdrawal;
    }

    /**
     * @return mixed
     */
    public function getAutoRenew()
    {
        return $this->autoRenew;
    }

    /**
     * @param mixed $autoRenew
     */
    public function setAutoRenew($autoRenew)
    {
        $this->autoRenew = $autoRenew;
    }


    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $id
     */
    public function setId($id)
    {
        $this->id = $id;
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
            "autoWithdrawable" => $this->getAutoWithdrawal()
        );
    }
}