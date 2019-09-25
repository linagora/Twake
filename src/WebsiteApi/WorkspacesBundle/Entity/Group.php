<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator;
use WebsiteApi\CoreBundle\Entity\SearchableObject;


/**
 * Group
 *
 * @ORM\Table(name="group_entity",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\GroupRepository")
 */
class Group extends SearchableObject
{

    protected $es_type = "group";

	/**
	 * @var int
	 *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
	 */
	protected $id;

	/**
     * @ORM\Column(name="name", type="string", length=255, options={"index"=true})
	 */
	protected $name;

	/**
     * @ORM\Column(name="display_name", type="twake_text")
     * @Encrypted
	 */
    protected $displayname;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 */
	protected $logo;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\PricingPlan")
     */
    protected $pricingplan;

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
     * @ORM\Column(type="twake_datetime")
	 */
	private $date_added;

    /**
     * @ORM\Column(name="on_creation_data", type="twake_text")
     * @Encrypted
     */
    protected $on_creation_data = "{}";

    /**
     * @ORM\Column(name="isblocked", type="twake_boolean")
     */
    private $isblocked = false;
    /**
     * @ORM\Column(name="isprivate", type="twake_boolean")
     */
    private $isprivate = false;


    public function __construct($name) {
		$this->name = $name;
		$this->date_added = new \DateTime();
	}

    /**
     * @return string
     */
    public function getEsType()
    {
        return $this->es_type;
    }


    public function getIndexationArray()
    {
        $return = Array(
            "id" => $this->getId()."",
            "name" => $this->getName(),
            "creation_date" => ($this->getDateAdded() ? ($this->getDateAdded()->format('U')*1000) : null),
        );
        return $return;
    }


    public function setId($id)
    {
        $this->id = $id;
    }

    public function getId()
    {
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
        return $this->displayname;
	}

	/**
     * @param mixed $displayname
	 */
    public function setDisplayName($displayname)
    {
        $this->displayname = $displayname;
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
        return $this->pricingplan;
	}

	/**
     * @param mixed $pricing_plan
	 */
    public function setPricingPlan($pricing_plan)
    {
        $this->pricingplan = $pricing_plan;
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
        return $this->isprivate;
    }

    /**
     * @param mixed $isprivate
     */
    public function setIsPrivate($isprivate)
    {
        $this->isprivate = $isprivate;
    }

    /**
     * @return mixed
     */
    public function getIsBlocked()
    {
        return $this->isblocked;
    }

    /**
     * @param mixed $isblocked
     */
    public function setIsBlocked($isblocked)
    {
        $this->isblocked = $isblocked;
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
            "id" => $this->getId(),
			"unique_name" => $this->getName(),
			"name" => $this->getDisplayName(),
            "plan" => (($this->getPricingPlan() != null) ? $this->getPricingPlan()->getLabel() : null),
			"logo" => (($this->getLogo()!=null)?$this->getLogo()->getPublicURL(2):""),
            "isBlocked" => $this->getIsBlocked(),
            "free_offer_end" => $this->getFreeOfferEnd()
		);
	}

}
