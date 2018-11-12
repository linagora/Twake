<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\WorkspacesBundle\Entity\GroupPeriod;



/**
 * GroupPeriod
 *
 * @ORM\Table(name="closed_group_period",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\GroupPeriodRepository")
 */
class ClosedGroupPeriod
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
     * @ORM\Column(name="current_cost", type="decimal", precision=15, scale=3)
     */
    protected $currentCost;

    /**
     * @ORM\Column(name="current_estimated_cost",  type="decimal", precision=15, scale=3)
     */
    protected $estimatedCost;

    /**
     * @ORM\Column(name="expected_cost",  type="decimal", precision=15, scale=3)
     */
    protected $expectedCost;

    /**
     * @ORM\Column(type="boolean")
     */
    private $billed;



	public function __construct($groupPeriod) {
		$this->group = $groupPeriod->getGroup();
		$this->setConnexions($groupPeriod->getConnexions());
        $this->setAppsUsagePeriod($groupPeriod->getAppsUsagePeriod());
		$this->periodStartedAt = $groupPeriod->getPeriodStartedAt();
        $this->periodEndedAt = new \DateTime();
        $this->periodExpectedToEndAt = $groupPeriod->getPeriodExpectedToEndAt();
        $this->currentCost = $groupPeriod->getCurrentCost();
        $this->estimatedCost = $groupPeriod->getEstimatedCost();
        $this->expectedCost = $groupPeriod->getExpectedCost();
        $this->billed = false;
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
    public function getAppsUsagePeriod()
    {
        return json_decode($this->appsUsage,true);
    }

    /**
     * @param mixed $appsUsage
     */
    public function setAppsUsagePeriod($appsUsage)
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
    public function getCurrentCost()
    {
        return $this->currentCost;
    }

    /**
     * @param mixed $currentEstimatedCost
     */
    public function setCurrentCost($currentEstimatedCost)
    {
        $this->currentCost = $currentEstimatedCost;
    }

    /**
     * @return mixed
     */
    public function getEstimatedCost()
    {
        return $this->estimatedCost;
    }

    /**
     * @param mixed $currentEstimatedCost
     */
    public function setEstimatedCost($currentEstimatedCost)
    {
        $this->estimatedCost = $currentEstimatedCost;
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

    /**
     * @return mixed
     */
    public function getBilled()
    {
        return $this->billed;
    }

    /**
     * @param mixed $billed
     */
    public function setBilled($billed)
    {
        $this->billed = $billed;
    }

    public function getAsArray(){
        return Array(
            "connexions" => $this->getConnexions(),
            "appUsage" => $this->getAppsUsagePeriod(),
            "periodStartedAt" => $this->getPeriodStartedAt(),
        "periodEndedAt" => $this->getPeriodEndedAt(),
        "periodExpectedToEndAt" => $this->getPeriodExpectedToEndAt(),
        "currentCost" => $this->getCurrentCost(),
        "estimatedCost" => $this->getEstimatedCost(),
        "expectedCost" => $this->getExpectedCost(),
        "billed" => $this->getBilled()
        );
    }



}
