<?php

namespace Twake\Workspaces\Entity;

use Doctrine\ORM\Mapping as ORM;

use Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator;
use Twake\Core\Entity\SearchableObject;


/**
 * Group
 *
 * @ORM\Table(name="group_entity",options={"engine":"MyISAM"})
 * @ORM\Entity()
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
     * @ORM\Column(name="plan", type="twake_text")
     */
    protected $plan;

    /**
     * @ORM\Column(name="stats", type="twake_text")
     */
    protected $stats;

    /**
     * @ORM\Column(name="logo", type="twake_text")
     */
    protected $logo;

    /**
     * @ORM\Column(name="identity_provider", type="twake_text")
     */
    protected $identity_provider = "";

    /**
     * @ORM\Column(name="identity_provider_id", type="twake_text")
     */
    protected $identity_provider_id = "";


    // Twake without console fields below

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Upload\Entity\File")
     * @ORM\JoinColumn(name="logo_id")
     */
    protected $logofile;

    /**
     * @ORM\Column(name="display_name", type="twake_text")
     */
    protected $displayname;
    
    /**
     * @ORM\OneToMany(targetEntity="Twake\Workspaces\Entity\Workspace", mappedBy="group")
     */
    private $workspaces;

    /**
     * @ORM\OneToMany(targetEntity="Twake\Workspaces\Entity\GroupUser", mappedBy="group")
     */
    private $managers;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date_added;

    /**
     * @ORM\Column(name="on_creation_data", type="twake_text")
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

    /**
     * @ORM\Column(name="member_count", type="twake_bigint")
     */
    private $member_count = false;


    public function __construct($name)
    {
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
            "id" => $this->getId() . "",
            "name" => $this->getName(),
            "creation_date" => ($this->getDateAdded() ? ($this->getDateAdded()->format('U') * 1000) : null),
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
    public function getStats()
    {
        $stats = [];
        if ($this->stats) {
            $stats = json_decode($this->stats, 1);
        }

        $stats["created_at"] = ($this->getDateAdded() ? ($this->getDateAdded()->format('U') * 1000) : 0);

        return $stats;
    }

    /**
     * @param mixed $data
     */
    public function setStats($stats)
    {
        $this->stats = json_encode($stats);
    }

    public function getIdentityProvider()
    {
        return $this->identity_provider;
    }

    public function setIdentityProvider($identity_provider)
    {
        if (!$identity_provider) {
            $this->identity_provider = "";
        }
        $this->identity_provider = $identity_provider;
    }

    public function getIdentityProviderId()
    {
        return $this->identity_provider_id;
    }

    public function setIdentityProviderId($identity_provider_id)
    {
        if (!$identity_provider_id) {
            $this->identity_provider_id = "";
        }
        $this->identity_provider_id = $identity_provider_id;
    }

    /**
     * @return mixed
     */
    public function getLogoFile()
    {
        return $this->logofile;
    }

    /**
     * @return mixed
     */
    public function getLogo()
    {
        if(!$this->logo){
            return $this->getLogoFile() ? $this->getLogoFile()->getPublicURL(2) : "";
        }
        return $this->logo ?: "";
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
    public function getPlan()
    {
        return json_decode($this->plan, 1);
    }

    /**
     * @param mixed $pricing_plan
     */
    public function setPlan($plan)
    {
        $this->plan = json_encode($plan);
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

    /**
     * @return mixed
     */
    public function getMemberCount()
    {
        if (!$this->member_count || $this->member_count < 0) {
            return 0;
        }
        return $this->member_count;
    }

    /**
     * @param mixed $member_count
     */
    public function setMemberCount($member_count)
    {
        $this->member_count = $member_count;
    }

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "name" => $this->getDisplayName(),
            "logo" => $this->getLogo(),
            "plan" => $this->getPlan(),
            "stats" => $this->getStats(),
        );
    }

}