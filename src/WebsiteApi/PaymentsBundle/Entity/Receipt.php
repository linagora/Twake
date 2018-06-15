<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 13/06/18
 * Time: 14:15
 */

namespace WebsiteApi\PaymentsBundle\Entity;


use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\UsersBundle\Entity\User;

/**
 * Receipt
 *
 * @ORM\Table(name="receipt_entity",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\PaymentsBundle\Repository\ReceiptRepository")
 */
class Receipt
{
    /**
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column(type="datetime")
     */
    private $issueDate;

    /**
     * @ORM\Column(type="datetime")
     */
    private $startDateOfService;
    /**
     * @ORM\Column(type="string", length=255)
     */
    private $billId;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\PaymentsBundle\Entity\GroupIdentity")
     */
    private $groupIdentity;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\PricingPlan")
     */
    private $pricingPlan;
    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\GroupPricingInstance")
     */
    private $groupPricingInstance;

    /**
     * @ORM\Column(type="text")
     */
    private $groupPeriods;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $discount;

    /**
     * Receipt constructor.
     * @param $id
     * @param $issueDate
     * @param $startDateOfService
     * @param $billId
     * @param $groupIdentity
     * @param $pricingPlan
     * @param $groupPricingInstance
     * @param $groupPeriods
     * @param $discount
     */
    public function __construct($issueDate, $startDateOfService, $billId, $groupIdentity, $pricingPlan, $groupPricingInstance, $groupPeriods, $discount = null)
    {
        $this->issueDate = $issueDate;
        $this->startDateOfService = $startDateOfService;
        $this->groupIdentity = $groupIdentity;
        $this->pricingPlan = $pricingPlan;
        $this->groupPricingInstance = $groupPricingInstance;
        $this->groupPeriods = $groupPeriods;
        $this->discount = $discount;
    }

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @return mixed
     */
    public function getIssueDate()
    {
        return $this->issueDate;
    }

    /**
     * @return mixed
     */
    public function getStartDateOfService()
    {
        return $this->startDateOfService;
    }

    /**
     * @return mixed
     */
    public function getBillId()
    {
        return $this->billId;
    }

    /**
     * @return mixed
     */
    public function getGroupIdentity()
    {
        return $this->groupIdentity;
    }

    /**
     * @return mixed
     */
    public function getPricingPlan()
    {
        return $this->pricingPlan;
    }

    /**
     * @return mixed
     */
    public function getGroupPricingInstance()
    {
        return $this->groupPricingInstance;
    }

    /**
     * @return mixed
     */
    public function getGroupPeriods()
    {
        return $this->groupPeriods;
    }

    /**
     * @return mixed
     */
    public function getDiscount()
    {
        return $this->discount;
    }

    /**
     * @param mixed $billId
     */
    public function setBillId($billId)
    {
        $this->billId = $billId;
    }


    public function getAsArray() {

        $receipt =  Array(
            "id" => $this->getId(),
            "issue_date" => $this->getIssueDate(),
            "start_date_of_service" => $this->getStartDateOfService(),
            "bill_id" => $this->getBillId(),
            "group_periods" => $this->getGroupPeriods(),
            "discount" => $this->getDiscount()
        );

        $group_identity = $this->getGroupIdentity()->getAsArray();

        $pricing_plan = $this->getPricingPlan()->getAsArray();

        $group_princing_instance = $this->getGroupPricingInstance()->getAsArray();

        $group_id = $this->getGroupIdentity()->getGroup()->getId();
        $users_number = Array(
            "users_number" => $this->get("app.groups")->countUsersGroup($group_id)
        );

        $res = array_merge($receipt, $group_identity,$pricing_plan, $group_princing_instance, $users_number);
        $res["id"] = $this->getId();

        return $res;
    }

}