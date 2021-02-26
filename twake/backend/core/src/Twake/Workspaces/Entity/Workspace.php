<?php

namespace Twake\Workspaces\Entity;

use Doctrine\ORM\Mapping as ORM;

use Twake\Core\Entity\SearchableObject;


/**
 * Workspace
 *
 * @ORM\Table(name="workspace",options={"engine":"MyISAM", "scylladb_keys": {{"id":"ASC"}  , {"group_id":"ASC", "id":"ASC"}}})
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
     * @ORM\Column(name="uniquename", type="twake_no_salt_text", nullable=true)
     */
    private $uniquename;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Upload\Entity\File")
     */
    private $logo;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Upload\Entity\File")
     */
    private $wallpaper;

    /**
     * @ORM\Column(name="wallpaper_color", type="string", length=50)
     */
    private $color = "#7E7A6D";

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Workspaces\Entity\Group")
     */
    private $group;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Users\Entity\User")
     */
    private $user;

    /**
     * @ORM\OneToMany(targetEntity="Twake\Workspaces\Entity\WorkspaceUser", mappedBy="workspace")
     */
    private $members;

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
     * @ORM\Column(name="isdeleted", type="twake_boolean")
     */
    private $is_deleted = false;

    /**
     * @ORM\Column(name="isarchived", type="twake_boolean")
     */
    private $isarchived = false;

    /**
     * @ORM\Column(name="isnew", type="twake_boolean")
     */
    private $isnew = true;

    /**
     * @ORM\Column(type="integer")
     */
    private $total_activity = 0;

    /**
     * @ORM\Column(name="isdefault", type="twake_boolean")
     */
    private $default = false;

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
            "group_id" => $this->getGroup() ? $this->getGroup()->getId() . "" : "",
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
    public function getWallpaper()
    {
        return $this->wallpaper;
    }

    /**
     * @param mixed $logo
     */
    public function setWallpaper($w)
    {
        $this->wallpaper = $w;
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
    public function getUser()
    {
        return $this->user;
    }

    /**
     * @param mixed $user
     */
    public function setUser($user)
    {
        $this->user = $user;
    }

    /**
     * @return mixed
     */
    public function getis_deleted()
    {
        return $this->is_deleted;
    }

    /**
     * @param mixed $is_deleted
     */
    public function setis_deleted($is_deleted)
    {
        $this->is_deleted = $is_deleted;
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
    public function getColor()
    {
        return $this->color;
    }

    /**
     * @param mixed $color
     */
    public function setColor($color)
    {
        $this->color = $color;
    }

    /**
     * @return mixed
     */
    public function getisArchived()
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
    public function getisNew()
    {
        return $this->getGroup() != null && $this->isnew;
    }

    /**
     * @param mixed $isnew
     */
    public function setIsNew($isnew)
    {
        $this->isnew = $isnew;
    }

    /**
     * @return mixed
     */
    public function getIsDefault()
    {
        return $this->default;
    }

    /**
     * @param mixed $isnew
     */
    public function setIsDefault($default)
    {
        $this->default = $default;
    }

    /**
     * @return mixed
     */
    public function getTotalActivity()
    {
        if ($this->member_count < 1) {
            $this->member_count = 1;
        }
        $date_interval = (date("U") - $this->date_added->getTimestamp()) / (60 * 60 * 24) + 1;
        $val = intval($this->total_activity) / ($date_interval / 2);
        $by_user = $val / $this->member_count;
        return $by_user;
    }

    /**
     * @param mixed $total_activity
     */
    public function setTotalActivity($total_activity)
    {
        $this->total_activity += 1;
    }


    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "private" => $this->getUser() != null,
            "logo" => (($this->getLogo()) ? $this->getLogo()->getPublicURL() : ""),
            "wallpaper" => (($this->getWallpaper()) ? $this->getWallpaper()->getPublicURL() : ""),
            "color" => $this->getColor(),
            "group" => (($this->getGroup()) ? $this->getGroup()->getAsArray() : null),
            "name" => $this->getName(),
            "total_members" => $this->getMemberCount(),
            "total_guests" => $this->getGuestCount(),
            "total_pending" => $this->getPendingCount(),
            "unique_name" => $this->getUniqueName(),
            "is_archived" => $this->getisArchived(),
            "is_new" => $this->getisNew()
        );
    }

}