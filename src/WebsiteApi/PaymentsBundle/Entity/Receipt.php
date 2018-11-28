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
     * @ORM\Column(name="id", type="cassandra_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
     */
    private $id;

    /**
     * @ORM\Column(type="cassandra_datetime")
     */
    private $issuedate;

    /**
     * @ORM\Column(type="cassandra_datetime")
     */
    private $startdateofservice;
    /**
     * @ORM\Column(type="string", length=255)
     */
    private $billid;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\PaymentsBundle\Entity\GroupIdentity")
     */
    private $groupidentity;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\PricingPlan")
     */
    private $pricingplan;
    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\GroupPricingInstance",cascade={"persist"})
     */
    private $grouppricinginstance;

    /**
     * @ORM\Column(type="text")
     */
    private $groupperiods;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $discount;

    /**
     * Receipt constructor.
     * @param $id
     * @param $issuedate
     * @param $startdateofservice
     * @param $billid
     * @param $groupidentity
     * @param $pricingplan
     * @param $grouppricinginstance
     * @param $groupperiods
     * @param $discount
     */
    public function __construct($issuedate, $startdateofservice, $billid, $groupidentity, $pricingplan, $grouppricinginstance, $groupperiods, $discount = null)
    {
        $this->issuedate = $issuedate;
        $this->startdateofservice = $startdateofservice;
        $this->billid = $billid;
        $this->groupidentity = $groupidentity;
        $this->pricingplan = $pricingplan;
        $this->grouppricinginstance = $grouppricinginstance;
        $this->groupperiods = json_encode($groupperiods->getAsArray());
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
        return $this->issuedate;
    }

    /**
     * @return mixed
     */
    public function getStartDateOfService()
    {
        return $this->startdateofservice;
    }

    /**
     * @return mixed
     */
    public function getBillId()
    {
        return $this->billid;
    }

    /**
     * @return mixed
     */
    public function getGroupIdentity()
    {
        return $this->groupidentity;
    }

    /**
     * @return mixed
     */
    public function getPricingPlan()
    {
        return $this->pricingplan;
    }

    /**
     * @return mixed
     */
    public function getGroupPricingInstance()
    {
        return $this->grouppricinginstance;
    }

    /**
     * @return mixed
     */
    public function getGroupPeriods()
    {
        return $this->groupperiods;
    }

    /**
     * @return mixed
     */
    public function getDiscount()
    {
        return $this->discount;
    }

    /**
     * @param mixed $billid
     */
    public function setBillId($billid)
    {
        $this->billid = $billid;
    }


    public function getAsArray() {

        $receipt =  Array(
            "id" => $this->getId(),
            "issue_date" => date_format($this->getIssueDate(), "d-m-Y"),
            "start_date_of_service" => date_format($this->getStartDateOfService(), "d-m-Y"),
            "bill_id" => $this->getBillId(),
            "group_periods" => $this->getGroupPeriods(),
            "discount" => $this->getDiscount()
        );

        //if ($this->getGroupIdentity() != null){
            $group_identity = $this->getGroupIdentity()->getAsArray();
        //}

        $pricing_plan = $this->getPricingPlan()->getAsArray();

        $group_princing_instance = $this->getGroupPricingInstance()->getAsArray();

        $res = array_merge($receipt, $group_identity,$pricing_plan, $group_princing_instance);
        $res["id"] = $this->getId();

        return $res;
    }

}