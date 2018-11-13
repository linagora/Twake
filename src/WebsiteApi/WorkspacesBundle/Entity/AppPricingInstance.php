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
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\GroupApp")
	 */
	private $groupapp;

    /**
     * @ORM\Column(name="cost_monthly", type="integer")
     */
    protected $costMonthly;

    /**
     * @ORM\Column(name="cost_per_user", type="integer")
     */
    protected $costUser;

	/**
     * @ORM\Column(type="cassandra_datetime")
	 */
	private $startedAt;


	public function __construct($groupapp) {
	    $this->group = $groupapp->getGroup();
		$this->groupapp = $groupapp;
        $this->costMonthly = $groupapp->getApp()->getPriceMonthly();
        $this->costUser = $groupapp->getApp()->getPriceUser();
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

    /**
     * @return mixed
     */
    public function getCostMonthly()
    {
        return $this->costMonthly;
    }

    /**
     * @param mixed $costMonthly
     */
    public function setCostMonthly($costMonthly)
    {
        $this->costMonthly = $costMonthly;
    }

    /**
     * @return mixed
     */
    public function getCostUser()
    {
        return $this->costUser;
    }

    /**
     * @param mixed $costUser
     */
    public function setCostUser($costUser)
    {
        $this->costUser = $costUser;
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

}
