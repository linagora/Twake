<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;


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
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
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
    protected $billedtype;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\PricingPlan")
     */
    private $originalpricingreference;

	/**
     * @ORM\Column(type="twake_datetime")
	 */
    private $startedat;

    /**
     * @ORM\Column(type="twake_datetime", nullable=true)
     */
    private $endat;


	public function __construct($group,$billtype,$pricing) {
		$this->group = $group;
        $this->cost = $billtype == "monthly" ? $pricing->getMonthPrice() : $pricing->getYearPrice();
        $this->billedtype = $billtype;
        $this->originalpricingreference = $pricing;
        $this->startedat = new \DateTime();
        $this->endat = new \DateTime();
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
        return $this->billedtype;
    }

    /**
     * @param mixed $billedtype
     */
    public function setBilledType($billedtype)
    {
        $this->billedtype = $billedtype;
    }

    /**
     * @return mixed
     */
    public function getOriginalPricingReference()
    {
        return $this->originalpricingreference;
    }

    /**
     * @param mixed $originalpricingreference
     */
    public function setOriginalPricingReference($originalpricingreference)
    {
        $this->originalpricingreference = $originalpricingreference;
    }

    /**
     * @return mixed
     */
    public function getStartedAt()
    {
        return $this->startedat;
    }

    /**
     * @param mixed $startedat
     */
    public function setStartedAt($startedat)
    {
        $this->startedat = $startedat;
    }

    /**
     * @return mixed
     */
    public function getEndAt()
    {
        return $this->endat;
    }

    /**
     * @param mixed $endat
     */
    public function setEndAt($endat)
    {
        $this->endat = $endat;
    }

    /**
     * @return int
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    public function getId()
    {
        return $this->id;
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
