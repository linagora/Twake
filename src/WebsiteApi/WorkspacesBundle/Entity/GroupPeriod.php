<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;


/**
 * GroupPeriod
 *
 * @ORM\Table(name="group_period",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\GroupPeriodRepository")
 */
class GroupPeriod
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
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
     * @ORM\Column(type="twake_datetime")
	 */
    private $periodstartedat;

    /**
     * @ORM\Column(type="twake_datetime", nullable=true)
     */
    private $periodendedat;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $periodexpectedtoendat;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\GroupPricingInstance")
     */
    private $grouppricinginstance;

    /**
     * @ORM\Column(name="current_cost", type="decimal", precision=65, scale=3)
     */
    protected $currentcost;

    /**
     * @ORM\Column(name="expected_cost", type="decimal" , precision=15, scale=3)
     */
    protected $expectedcost;

    /**
     * @ORM\Column(name="estimated_cost", type="decimal", precision=15, scale=3)
     */
    protected $estimatedcost;

	public function __construct($group) {
		$this->group = $group;
		$this->connexions = "{}";
        $this->appsusage = "{}";
        $this->periodstartedat = new \DateTime();
        $this->periodendedat = null;
        $datefin = new \DateTime();
        $datefin->modify('+1 month');
        $this->periodexpectedtoendat = $datefin;
        $this->grouppricinginstance = null;
        $this->currentcost = 0;
        $this->estimatedcost = 0;
        $this->expectedCost= 0;
	}

	public function getAsArray(){
	    return Array(
	        "groupId" => $this->group->getId(),
            "connexions" => $this->getConnexions(),
            "appsUsage" => $this->getAppsUsagePeriod(),
            "periodstartedat" => $this->periodstartedat,
            "periodendedat" => $this->periodendedat,
            "periodexpectedtoendat" => $this->periodexpectedtoendat,
            "groupPricingInstanceId" => $this->groupPricingInstance == null ? null : $this->grouppricinginstance->getId(),
            "currentCost" => $this->currentcost,
            "estimatedCost" => $this->estimatedcost,
            "expectedCost" => $this->expectedcost
        );
    }


    public function isEquivalentTo($group_period){
        /*var_dump("Connexions");
	    var_dump($this->getConnexions());
        var_dump($group_period->getConnexions());
        */if ($this->getConnexions() != $group_period->getConnexions()) {
            return false;
        }
        /*var_dump("Apps");
        var_dump($this->getAppsUsagePeriod());
        var_dump($group_period->getAppsUsagePeriod());
        */if ($this->getAppsUsagePeriod() != $group_period->getAppsUsagePeriod()) {
            return false;
        }
        /*var_dump("Period start");
        var_dump($this->getPeriodStartedAt());
        var_dump($group_period->getPeriodStartedAt());
        */if ($this->getPeriodStartedAt() != $group_period->getPeriodStartedAt()) {
            return false;
        }
        /*var_dump("Period expected to end");
        var_dump($this->getPeriodExpectedToEndAt());
        var_dump($group_period->getPeriodExpectedToEndAt());
        */if ($this->getPeriodExpectedToEndAt() != $group_period->getPeriodExpectedToEndAt()) {
            return false;
        }
        /*var_dump("Current cost");
        var_dump($this->getCurrentCost());
        var_dump($group_period->getCurrentCost());
        */if ($this->getCurrentCost() != $group_period->getCurrentCost()) {
            return false;
        }
        /*var_dump("Expected cost");
        var_dump($this->getExpectedCost());
        var_dump($group_period->getExpectedCost());
        */if ($this->getExpectedCost() != $group_period->getExpectedCost()) {
            return false;
        }
        /*var_dump("Estimated cost");
        var_dump($this->getEstimatedCost());
        var_dump($group_period->getEstimatedCost());
        */if ($this->getEstimatedCost() != $group_period->getEstimatedCost()) {
            return false;
        }
        return true;
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
    public function getGroupPricingInstance()
    {
        return $this->grouppricinginstance;
    }

    /**
     * @param mixed $grouppricinginstance
     */
    public function setGroupPricingInstance($grouppricinginstance)
    {
        $this->grouppricinginstance = $grouppricinginstance;
        if ($grouppricinginstance != null) {
            $this->periodexpectedtoendat = $grouppricinginstance->getEndAt();
        }
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
     * @return mixed
     */
    public function getEstimatedCost()
    {
        return $this->estimatedcost;
    }

    /**
     * @param mixed $estimatedcost
     */
    public function setEstimatedCost($estimatedcost)
    {
        $this->estimatedcost = $estimatedcost;
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
