<?php

namespace Twake\Workspaces\Entity;

use Doctrine\ORM\Mapping as ORM;

use Twake\Core\Entity\SearchableObject;


/**
 * Workspace
 *
 * @ORM\Table(name="workspaces",options={"engine":"MyISAM", "scylladb_keys": {{"company_id":"ASC", "id":"ASC"}, {"id":"ASC"}, {"company_id":"ASC"}}})
 * @ORM\Entity()
 */
class Workspace extends SearchableObject
{

    protected $es_type = "workspace";

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="name", type="twake_no_salt_text", nullable=true)
     */
    private $name;

    /**
     * @ORM\Column(name="logo", type="twake_text")
     */
    private $logo;

    /**
     * @ORM\Column(name="stats", type="twake_text")
     */
    protected $stats;


    // Twake without console fields below


    /**
     * @ORM\Column(name="isdeleted", type="twake_boolean")
     */
    private $isdeleted = false;

    /**
     * @ORM\Column(name="isarchived", type="twake_boolean")
     */
    private $isarchived = false;

    /**
     * @ORM\Column(name="isdefault", type="twake_boolean")
     */
    private $isdefault = false;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Upload\Entity\File")
     * @ORM\JoinColumn(name="logo_id")
     */
    private $logofile;

    /**
     * @ORM\Column(name="uniquename", type="twake_no_salt_text", nullable=true)
     */
    private $uniquename;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Workspaces\Entity\Group")
     * @ORM\JoinColumn(name="company_id")
     */
    private $group;

    /**
     * @ORM\Column(name="member_count", type="integer")
     */
    private $member_count = 0;

    /**
     * @ORM\Column(name="guest_count", type="integer")
     */
    private $guest_count = 0;

    /**
     * @ORM\Column(name="pending_count", type="integer")
     */
    private $pending_count = 0;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date_added;

    /**
     * @ORM\OneToMany(targetEntity="Twake\Workspaces\Entity\WorkspaceUser", mappedBy="workspace")
     */
    private $members;

    /**
     * Workspace constructor.
     * @param $name
     */
    public function __construct($name)
    {
        $this->name = $name;
        $this->date_added = new \DateTime();
    }

    public function getIndexationArray()
    {
        $return = Array(
            "id" => $this->getId() . "",
            "name" => $this->getName(),
            "company_id" => $this->getGroup() ? $this->getGroup()->getId() . "" : "",
            "creation_date" => ($this->getDateAdded() ? $this->getDateAdded()->format('Y-m-d') : null),
        );
        return $return;
    }

    /**
     * @return string
     */
    public function getEsType()
    {
        return $this->es_type;
    }

    /**
     * @param string $es_type
     */
    public function setEsType($es_type)
    {
        $this->es_type = $es_type;
    }


    /**
     * @return int
     */
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
    public function getDateAdded()
    {
        return $this->date_added;
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
    public function getUniqueName()
    {
        return $this->uniquename;
    }

    /**
     * @param mixed $name
     */
    public function setUniqueName($name)
    {
        $this->uniquename = $name;
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
            $this->setLogo($this->getLogoFile() ? $this->getLogoFile()->getPublicURL(2) : "");
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
    public function getIsDeleted()
    {
        return $this->isdeleted;
    }

    /**
     * @param mixed $isdeleted
     */
    public function setIsDeleted($isdeleted)
    {
        $this->isdeleted = $isdeleted;
    }

    /**
     * @return mixed
     */
    public function getMembers()
    {
        return $this->members;
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
    
    public function getGuestCount()
    {
        if (!$this->guest_count || $this->guest_count < 0) {
            return 0;
        }
        return $this->guest_count;
    }
    
    public function setGuestCount($guest_count)
    {
        $this->guest_count = $guest_count;
    }
    
    public function getPendingCount()
    {
        if (!$this->pending_count || $this->pending_count < 0) {
            return 0;
        }
        return $this->pending_count;
    }
    
    public function setPendingCount($pending_count)
    {
        $this->pending_count = $pending_count;
    }

    /**
     * @return mixed
     */
    public function getIsArchived()
    {
        return $this->isarchived;
    }

    /**
     * @param mixed $isarchived
     */
    public function setIsArchived($isarchived)
    {
        $this->isarchived = $isarchived;
    }

    /**
     * @return mixed
     */
    public function getIsDefault()
    {
        return $this->isdefault;
    }

    /**
     * @param mixed $isnew
     */
    public function setIsDefault($default)
    {
        $this->isdefault = $default;
    }


    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "company_id" => (($this->getGroup()) ? $this->getGroup()->getId() : null),
            "name" => $this->getName(),
            "logo" => $this->getLogo(),

            "default" => $this->getIsDefault(),
            "archived" => $this->getIsArchived(),

            "stats" => [
                "created_at" => $this->date_added ? ($this->date_added->getTimestamp() * 1000) : 0,
                "total_members" => $this->getMemberCount(),
                "total_guests" => $this->getGuestCount(),
                "total_pending" => $this->getPendingCount(),
            ],

            "group" => (($this->getGroup()) ? $this->getGroup()->getAsArray() : null),
        );
    }

}