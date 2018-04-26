<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * AppPricingInstance
 *
 * @ORM\Table(name="app_pricing",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\AppPricingInstanceRepository")
 */
class AppPricingInstance
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\GroupApp")
	 */
	private $groupapp;

    /**
     * @ORM\Column(name="cost", type="integer")
     */
    protected $cost;

    /**
     * @ORM\Column(name="billed_type", type="string", length=10)
     */
    protected $billedType;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $startedAt;


	public function __construct($groupapp,$billtype,$pricing) {
		$this->groupapp = $groupapp;
        $this-> cost = 0;
		$this->billedType = $billtype;
		$this->startedAt = new \DateTime();
	}

    /**
     * @return mixed
     */
    public function getGroupapp()
    {
        return $this->groupapp;
    }

    /**
     * @param mixed $groupapp
     */
    public function setGroupapp($groupapp)
    {
        $this->groupapp = $groupapp;
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

}
