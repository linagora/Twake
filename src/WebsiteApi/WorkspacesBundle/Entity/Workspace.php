<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;




/**
 * Workspace
 *
 * @ORM\Table(name="workspace",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\WorkspaceRepository")
 */
class Workspace
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
     */
    private $id;

	/**
     * @ORM\Column(name="name", type="string", length=50, nullable=true)
	 */
	private $name;

    /**
     * @ORM\Column(name="uniquename", type="string", length=50, nullable=true)
     */
    private $uniquename;


    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 */
	private $logo;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
     */
    private $wallpaper;

    /**
     * @ORM\Column(name="wallpaper_color", type="string", length=50)
     */
    private $color = "#7E7A6D";

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
	 */
	private $group;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
	private $user;

	/**
     * @ORM\OneToMany(targetEntity="WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser", mappedBy="workspace")
	 */
	private $members;

    /**
     * @ORM\Column(name="member_count", type="integer")
     */
    private $member_count = 0;

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
     * Workspace constructor.
     * @param $name
     */
	public function __construct($name) {
		$this->name = $name;
		$this->date_added = new \DateTime();
	}

	/**
	 * @return int
	 */
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
        if(!$this->member_count || $this->member_count<0){
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
    public function getTotalActivity()
    {
        return intval($this->total_activity);
    }

    /**
     * @param mixed $total_activity
     */
    public function setTotalActivity($total_activity)
    {
        $this->total_activity = $total_activity;
    }


	public function getAsArray(){
		return Array(
			"id"=> $this->getId(),
			"private" => $this->getUser()!=null,
			"logo" => (($this->getLogo())?$this->getLogo()->getPublicURL():""),
			"wallpaper" => (($this->getWallpaper())?$this->getWallpaper()->getPublicURL():""),
            "color" => $this->getColor(),
			"group" => (($this->getGroup())?$this->getGroup()->getAsArray():null),
			"name" => $this->getName(),
            "total_members" => $this->getMemberCount() - 1, //Remove Twake bot
            "uniqueName" => $this->getUniqueName(),
            "isArchived" => $this->getisArchived(),
            "isNew" => $this->getisNew()
		);
	}

}
