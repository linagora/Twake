<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;




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
     * @ORM\Column(name="free_offer_end", type="integer", nullable=true)
     */
    protected $free_offer_end = null;

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
     * @ORM\Column(name="on_creation_data", type="string", length=1000)
     */
    protected $on_creation_data = "{}";

    /**
     * @ORM\Column(type="boolean")
     */
    private $isBlocked = false;
    /**
     * @ORM\Column(type="boolean")
     */
    private $isPrivate = false;


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

    /**
     * @return mixed
     */
    public function getisPrivate()
    {
        return $this->isPrivate;
    }

    /**
     * @param mixed $isPrivate
     */
    public function setIsPrivate($isPrivate)
    {
        $this->isPrivate = $isPrivate;
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

    /**
     * @return mixed
     */
    public function getFreeOfferEnd()
    {
        return $this->free_offer_end;
    }

    /**
     * @param mixed $free_offer_end
     */
    public function setFreeOfferEnd($free_offer_end)
    {
        $this->free_offer_end = $free_offer_end;
    }

    /**
     * @return mixed
     */
    public function getOnCreationData()
    {
        @$v = json_decode($this->on_creation_data, 1);
        if (!$v) {
            $v = Array();
        }
        return $v;
    }

    public function getOnCreationDataAsText()
    {
        return $this->on_creation_data;
    }

    /**
     * @param mixed $on_creation_data
     */
    public function setOnCreationData($on_creation_data)
    {
        $this->on_creation_data = json_encode($on_creation_data);
    }



	public function getAsArray(){
		return Array(
			"unique_name" => $this->getName(),
			"name" => $this->getDisplayName(),
			"plan" => $this->getPricingPlan()->getLabel(),
			"id" => $this->getId(),
			"logo" => (($this->getLogo()!=null)?$this->getLogo()->getPublicURL(2):""),
            "isBlocked" => $this->getIsBlocked(),
            "free_offer_end" => $this->getFreeOfferEnd()
		);
	}

}
