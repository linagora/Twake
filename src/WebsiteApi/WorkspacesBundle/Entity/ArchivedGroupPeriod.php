<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\WorkspacesBundle\Entity\GroupPeriod;



/**
 * GroupPeriod
 *
 * @ORM\Table(name="archived_group_period",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\GroupPeriodRepository")
 */
class ArchivedGroupPeriod
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
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
	 */
	private $group;

    /**
     * @ORM\Column(name="connexions", type="string", length=100000)
     */
    protected $connexions;

    /**
     * @ORM\Column(name="app_usage", type="string", length=100000)
     */
    protected $appsUsage;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $periodStartedAt;

    /**
     * @ORM\Column(type="datetime", nullable=true)
     */
    private $periodEndedAt;

    /**
     * @ORM\Column(type="datetime")
     */
    private $periodExpectedToEndAt;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\GroupPricingInstance")
     */
    private $groupPricingInstance;

    /**
     * @ORM\Column(name="current_estimated_cost", type="integer")
     */
    protected $currentEstimatedCost;

    /**
     * @ORM\Column(name="expected_cost", type="integer")
     */
    protected $expectedCost;

    /**
     * @ORM\Column(type="boolean")
     */
    private $billed;



	public function __construct($groupPeriod) {
		$this->group = $groupPeriod->getGroup();
		$this->setConnexions($groupPeriod->getConnexions());
		$this->setAppsUsage($groupPeriod->getAppsUsage());
		$this->periodStartedAt = $groupPeriod->getPeriodStartedAt();
        $this->periodEndedAt = $groupPeriod->getPeriodEndedAt();
        $this->periodExpectedToEndAt = $groupPeriod->getPeriodExpectedToEndAt();
        $this->groupPricingInstance = $groupPeriod->getGroupPricingInstance();
        $this->currentEstimatedCost = $groupPeriod->getCurrentEstimatedCost();
        $this->expectedCost = $groupPeriod->getExpectedCost();
        $this->billed = true;
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
    public function getConnexions()
    {
        return json_decode($this->connexions,true);
    }

    /**
     * @param mixed $connexions
     */
    public function setConnexions($connexions)
    {
        $this->connexions = json_encode($connexions);
    }

    /**
     * @return mixed
     */
    public function getAppsUsage()
    {
        return json_decode($this->appsUsage,true);
    }

    /**
     * @param mixed $appsUsage
     */
    public function setAppsUsage($appsUsage)
    {
        $this->appsUsage = json_encode($appsUsage);
    }

    /**
     * @return mixed
     */
    public function getPeriodStartedAt()
    {
        return $this->periodStartedAt;
    }

    /**
     * @param mixed $periodStartedAt
     */
    public function setPeriodStartedAt($periodStartedAt)
    {
        $this->periodStartedAt = $periodStartedAt;
    }

    /**
     * @return mixed
     */
    public function getPeriodEndedAt()
    {
        return $this->periodEndedAt;
    }

    /**
     * @param mixed $periodEndedAt
     */
    public function setPeriodEndedAt($periodEndedAt)
    {
        $this->periodEndedAt = $periodEndedAt;
    }

    /**
     * @return mixed
     */
    public function getPeriodExpectedToEndAt()
    {
        return $this->periodExpectedToEndAt;
    }

    /**
     * @param mixed $periodExpectedToEndAt
     */
    public function setPeriodExpectedToEndAt($periodExpectedToEndAt)
    {
        $this->periodExpectedToEndAt = $periodExpectedToEndAt;
    }

    /**
     * @return mixed
     */
    public function getGroupPricingInstance()
    {
        return $this->groupPricingInstance;
    }

    /**
     * @param mixed $groupPricingInstance
     */
    public function setGroupPricingInstance($groupPricingInstance)
    {
        $this->groupPricingInstance = $groupPricingInstance;
        $this->periodExpectedToEndAt = $groupPricingInstance->getEndAt();
    }

    /**
     * @return mixed
     */
    public function getCurrentEstimatedCost()
    {
        return $this->currentEstimatedCost;
    }

    /**
     * @param mixed $currentEstimatedCost
     */
    public function setCurrentEstimatedCost($currentEstimatedCost)
    {
        $this->currentEstimatedCost = $currentEstimatedCost;
    }

    /**
     * @return mixed
     */
    public function getExpectedCost()
    {
        return $this->expectedCost;
    }

    /**
     * @param mixed $expectedCost
     */
    public function setExpectedCost($expectedCost)
    {
        $this->expectedCost = $expectedCost;
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




}
