<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;


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
     * @ORM\Column(name="current_cost", type="decimal", precision=5, scale=3)
     */
    protected $currentCost;

    /**
     * @ORM\Column(name="expected_cost", type="decimal" , precision=5, scale=3)
     */
    protected $expectedCost;

    /**
     * @ORM\Column(name="estimated_cost", type="decimal", precision=5, scale=3)
     */
    protected $estimatedCost;

	public function __construct($group) {
		$this->group = $group;
		$this->connexions = "{}";
        $this->appsUsage = "{}";
		$this->periodStartedAt = new \DateTime();
        $this->periodEndedAt = null;
        $datefin = new \DateTime();
        $datefin->modify('+1 month');
        $this->periodExpectedToEndAt = $datefin;
        $this->groupPricingInstance = null;
        $this->currentCost = 0;
        $this->estimatedCost = 0;
        $this->expectedCost= 0;
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
        if ($groupPricingInstance != null){
            $this->periodExpectedToEndAt = $groupPricingInstance->getEndAt();
        }
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
     * @return mixed
     */
    public function getEstimatedCost()
    {
        return $this->estimatedCost;
    }

    /**
     * @param mixed $EstimatedCost
     */
    public function setEstimatedCost($EstimatedCost)
    {
        $this->estimatedCost = $EstimatedCost;
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
