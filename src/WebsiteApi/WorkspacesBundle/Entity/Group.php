<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;




/**
 * Group
 *
 * @ORM\Table(name="group_entity",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\GroupRepository")
 */
class Group
{
	/**
	 * @var int
	 *
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;

	/**
	 * @ORM\Column(name="name", type="string", length=255)
	 */
	protected $name;

	/**
	 * @ORM\Column(name="display_name", type="string", length=255)
	 */
	protected $displayName;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 */
	protected $logo;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\PricingPlan")
	 */
	protected $pricingPlan;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace", mappedBy="group")
	 */
	private $workspaces;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\WorkspacesBundle\Entity\GroupUser", mappedBy="group")
	 */
	private $managers;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date_added;
    /**
     * @ORM\Column(type="boolean")
     */
    private $isBlocked;


    public function __construct($name) {
		$this->name = $name;
		$this->date_added = new \DateTime();
	}

	public function getId(){
		return $this->id;
	}

	/**
	 * @return mixed
	 */
	public function getName()
	{
		return $this->name;
	}

	/**
	 * @param mixed $name
	 */
	public function setName($name)
	{
		$this->name = $name;
	}

	/**
	 * @return mixed
	 */
	public function getDisplayName()
	{
		return $this->displayName;
	}

	/**
	 * @param mixed $displayName
	 */
	public function setDisplayName($displayName)
	{
		$this->displayName = $displayName;
	}

	/**
	 * @return mixed
	 */
	public function getLogo()
	{
		return $this->logo;
	}

	/**
	 * @param mixed $logo
	 */
	public function setLogo($logo)
	{
		$this->logo = $logo;
	}

	/**
	 * @return mixed
	 */
	public function getPricingPlan()
	{
		return $this->pricingPlan;
	}

	/**
	 * @param mixed $pricingPlan
	 */
	public function setPricingPlan($pricingPlan)
	{
		$this->pricingPlan = $pricingPlan;
	}

	/**
	 * @return mixed
	 */
	public function getWorkspaces()
	{
		return $this->workspaces;
	}

	/**
	 * @param mixed $workspaces
	 */
	public function setWorkspaces($workspaces)
	{
		$this->workspaces = $workspaces;
	}

	/**
	 * @return mixed
	 */
	public function getManagers()
	{
		return $this->managers;
	}

	/**
	 * @param mixed $managers
	 */
	public function setManagers($managers)
	{
		$this->managers = $managers;
	}

	/**
	 * @return mixed
	 */
	public function getDateAdded()
	{
		return $this->date_added;
	}

	/**
	 * @param mixed $date_added
	 */
	public function setDateAdded($date_added)
	{
		$this->date_added = $date_added;
	}

	public function getAsArray(){
		return Array(
			"unique_name" => $this->getName(),
			"name" => $this->getDisplayName(),
			"plan" => $this->getPricingPlan()->getLabel(),
			"id" => $this->getId(),
			"logo" => (($this->getLogo()!=null)?$this->getLogo()->getPublicURL(2):"")
		);
	}

    /**
     * @return mixed
     */
    public function getIsBlocked()
    {
        return $this->isBlocked;
    }

    /**
     * @param mixed $isBlocked
     */
    public function setIsBlocked($isBlocked)
    {
        $this->isBlocked = $isBlocked;
    }

}
