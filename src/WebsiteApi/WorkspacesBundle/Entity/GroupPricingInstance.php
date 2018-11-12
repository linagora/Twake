<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * GroupPricingInstance
 *
 * @ORM\Table(name="group_pricing",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\GroupPricingInstanceRepository")
 */
class GroupPricingInstance
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="cassandra_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
     */
    private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
	 */
	private $group;

    /**
     * @ORM\Column(name="cost", type="integer")
     */
    protected $cost;

    /**
     * @ORM\Column(name="billed_type", type="string", length=25)
     */
    protected $billedType;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\PricingPlan")
     */
    private $originalPricingReference;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $startedAt;

    /**
     * @ORM\Column(type="datetime", nullable=true)
     */
    private $endAt;


	public function __construct($group,$billtype,$pricing) {
		$this->group = $group;
        $this->cost = $billtype == "monthly" ? $pricing->getMonthPrice() : $pricing->getYearPrice();
		$this->billedType = $billtype;
        $this->originalPricingReference = $pricing;
		$this->startedAt = new \DateTime();
        $this->endAt = new \DateTime();
	}

    /**
     * @return mixed
     */
    public function getGroup()
    {
        return $this->group;
    }

    /**
     * @param mixed $group
     */
    public function setGroup($group)
    {
        $this->group = $group;
    }

    /**
     * @return mixed
     */
    public function getCost()
    {
        return $this->cost;
    }

    /**
     * @param mixed $cost
     */
    public function setCost($cost)
    {
        $this->cost = $cost;
    }

    /**
     * @return mixed
     */
    public function getBilledType()
    {
        return $this->billedType;
    }

    /**
     * @param mixed $billedType
     */
    public function setBilledType($billedType)
    {
        $this->billedType = $billedType;
    }

    /**
     * @return mixed
     */
    public function getOriginalPricingReference()
    {
        return $this->originalPricingReference;
    }

    /**
     * @param mixed $originalPricingReference
     */
    public function setOriginalPricingReference($originalPricingReference)
    {
        $this->originalPricingReference = $originalPricingReference;
    }

    /**
     * @return mixed
     */
    public function getStartedAt()
    {
        return $this->startedAt;
    }

    /**
     * @param mixed $startedAt
     */
    public function setStartedAt($startedAt)
    {
        $this->startedAt = $startedAt;
    }

    /**
     * @return mixed
     */
    public function getEndAt()
    {
        return $this->endAt;
    }

    /**
     * @param mixed $endAt
     */
    public function setEndAt($endAt)
    {
        $this->endAt = $endAt;
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param int $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }



    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "group" => $this->getGroup(),
            "cost" => $this->getCost(),
            "billed_type" => $this->getBilledType(),
            "started_at" => $this->getStartedAt(),
            "end_at" => $this->getEndAt()
        );


    }

}
