<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * GroupPeriod
 *
 * @ORM\Table(name="group_pricing",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\GroupPricingInstanceRepository")
 */
class GroupPricingInstance
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
     * @ORM\Column(name="cost", type="integer")
     */
    protected $cost;

    /**
     * @ORM\Column(name="billed_type", type="string", length=10)
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
        $this-> cost = 0;
		$this->billedType = $billtype;
        $this->originalPricingReference = $pricing;
		$this->startedAt = new \DateTime();
        $this->endAt = new \DateTime();;
	}

}
