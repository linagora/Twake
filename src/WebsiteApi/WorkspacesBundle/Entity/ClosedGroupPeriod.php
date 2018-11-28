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
    protected $appsusage;

	/**
     * @ORM\Column(type="cassandra_datetime")
	 */
    private $periodstartedat;

    /**
     * @ORM\Column(type="cassandra_datetime", nullable=true)
     */
    private $periodendedat;

    /**
     * @ORM\Column(type="cassandra_datetime")
     */
    private $periodexpectedtoendat;

    /**
     * @ORM\Column(name="current_cost", type="decimal", precision=15, scale=3)
     */
    protected $currentcost;

    /**
     * @ORM\Column(name="current_estimated_cost",  type="decimal", precision=15, scale=3)
     */
    protected $estimatedcost;

    /**
     * @ORM\Column(name="expected_cost",  type="decimal", precision=15, scale=3)
     */
    protected $expectedcost;

    /**
     * @ORM\Column(type="cassandra_boolean")
     */
    private $billed;


    public function __construct($groupperiod)
    {
        $this->group = $groupperiod->getGroup();
        $this->setConnexions($groupperiod->getConnexions());
        $this->setAppsUsagePeriod($groupperiod->getAppsUsagePeriod());
        $this->periodstartedat = $groupperiod->getPeriodStartedAt();
        $this->periodendedat = new \DateTime();
        $this->periodexpectedtoendat = $groupperiod->getPeriodExpectedToEndAt();
        $this->currentcost = $groupperiod->getCurrentCost();
        $this->estimatedcost = $groupperiod->getEstimatedCost();
        $this->expectedcost = $groupperiod->getExpectedCost();
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
        return json_decode($this->appsusage, true);
    }

    /**
     * @param mixed $appsusage
     */
    public function setAppsUsagePeriod($appsusage)
    {
        $this->appsusage = json_encode($appsusage);
    }

    /**
     * @return mixed
     */
    public function getPeriodStartedAt()
    {
        return $this->periodstartedat;
    }

    /**
     * @param mixed $periodstartedat
     */
    public function setPeriodStartedAt($periodstartedat)
    {
        $this->periodstartedat = $periodstartedat;
    }

    /**
     * @return mixed
     */
    public function getPeriodEndedAt()
    {
        return $this->periodendedat;
    }

    /**
     * @param mixed $periodendedat
     */
    public function setPeriodEndedAt($periodendedat)
    {
        $this->periodendedat = $periodendedat;
    }

    /**
     * @return mixed
     */
    public function getPeriodExpectedToEndAt()
    {
        return $this->periodexpectedtoendat;
    }

    /**
     * @param mixed $periodexpectedtoendat
     */
    public function setPeriodExpectedToEndAt($periodexpectedtoendat)
    {
        $this->periodexpectedtoendat = $periodexpectedtoendat;
    }

    /**
     * @return mixed
     */
    public function getCurrentCost()
    {
        return $this->currentcost;
    }

    /**
     * @param mixed $currentestimatedcost
     */
    public function setCurrentCost($currentestimatedcost)
    {
        $this->currentcost = $currentestimatedcost;
    }

    /**
     * @return mixed
     */
    public function getEstimatedCost()
    {
        return $this->estimatedcost;
    }

    /**
     * @param mixed $currentestimatedcost
     */
    public function setEstimatedCost($currentestimatedcost)
    {
        $this->estimatedcost = $currentestimatedcost;
    }

    /**
     * @return mixed
     */
    public function getExpectedCost()
    {
        return $this->expectedcost;
    }

    /**
     * @param mixed $expectedcost
     */
    public function setExpectedCost($expectedcost)
    {
        $this->expectedcost = $expectedcost;
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
            "periodstartedat" => $this->getPeriodStartedAt(),
            "periodendedat" => $this->getPeriodEndedAt(),
            "periodexpectedtoendat" => $this->getPeriodExpectedToEndAt(),
        "currentCost" => $this->getCurrentCost(),
        "estimatedCost" => $this->getEstimatedCost(),
        "expectedCost" => $this->getExpectedCost(),
        "billed" => $this->getBilled()
        );
    }



}
