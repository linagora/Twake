<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 13/06/18
 * Time: 14:16
 */

namespace WebsiteApi\PaymentsBundle\Entity;

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
     * @ORM\Column(name="group_id", type="integer")
     */
    private $group_id;

    /**
     * @ORM\Column(name="pricing_plan_id", type="integer")
     */
    private $pricing_plan_id;

    /**
     * @ORM\Column(name="balance", type = "decimal")
     */
    private $balance;

    /**
     * @ORM\Column(name="balance_consumed, type="decimal")
     */
    private $balance_consumed = 0;

    /**
     * @ORM\Column(name="start_date", type="datetime")
     */
    private $start_date;

    /**
     * @ORM\Column(name="end_date", type="datetime")
     */
    private $end_date;

    /**
     * @ORM/Column(name="auto_withdrawal", type = "boolean")
     */
    private $auto_withdrawal;
    /**
     * @ORM/Column(name="auto_renew", type = "boolean")
     */
    private $auto_renew;

    /**
     * @ORM/Column(name="archived", type = "boolean")
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
    public function __construct($group_id, $pricing_plan_id, $balance, $start_date, $end_date, $auto_withdrawal, $auto_renew)
    {
        $this->group_id = $group_id;
        $this->pricing_plan_id = $pricing_plan_id;
        $this->balance = $balance;
        $this->start_date = $start_date;
        $this->end_date = $end_date;
        $this->auto_withdrawal = $auto_withdrawal;
        $this->auto_renew = $auto_renew;
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
    public function getGroupId()
    {
        return $this->group_id;
    }

    /**
     * @param mixed $group_id
     */
    public function setGroupId($group_id)
    {
        $this->group_id = $group_id;
    }

    /**
     * @return mixed
     */
    public function getPricingPlanId()
    {
        return $this->pricing_plan_id;
    }

    /**
     * @param mixed $pricing_plan_id
     */
    public function setPricingPlanId($pricing_plan_id)
    {
        $this->pricing_plan_id = $pricing_plan_id;
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
        return $this->balance_consumed;
    }

    /**
     * @param mixed $balance_consumed
     */
    public function setBalanceConsumed($balance_consumed)
    {
        $this->balance_consumed = $balance_consumed;
    }

    /**
     * @return mixed
     */
    public function getStartDate()
    {
        return $this->start_date;
    }

    /**
     * @param mixed $start_date
     */
    public function setStartDate($start_date)
    {
        $this->start_date = $start_date;
    }

    /**
     * @return mixed
     */
    public function getEndDate()
    {
        return $this->end_date;
    }

    /**
     * @param mixed $end_date
     */
    public function setEndDate($end_date)
    {
        $this->end_date = $end_date;
    }

    /**
     * @return mixed
     */
    public function getAutoWithdrawal()
    {
        return $this->auto_withdrawal;
    }

    /**
     * @param mixed $auto_withdrawal
     */
    public function setAutoWithdrawal($auto_withdrawal)
    {
        $this->auto_withdrawal = $auto_withdrawal;
    }

    /**
     * @return mixed
     */
    public function getAutoRenew()
    {
        return $this->auto_renew;
    }

    /**
     * @param mixed $auto_renew
     */
    public function setAutoRenew($auto_renew)
    {
        $this->auto_renew = $auto_renew;
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


    public function getAsSimpleArray() {

        return Array(
            "id" => $this->getId(),
            "groupId" => $this->getGroupId(),
            "pricingPlan" => $this->getPricingPlanId(),
            "startDate" => $this->getStartDate()->getTimestamp(),
            "endDate" => $this->getEndDate()->getTimestamp(),
            "balance" => $this->getBalance(),
            "balanceConsumed" => $this->getBalanceConsumed(),
            "autoRenew" => $this->getAutoRenew(),
            "autoWithdrawable" => $this->getAutoWithdrawal()
        );
    }
}