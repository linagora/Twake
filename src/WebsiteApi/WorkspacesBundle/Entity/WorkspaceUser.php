<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * WorkspaceUser
 *
 * @ORM\Table(name="workspace_user",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\WorkspaceUserRepository")
 */
class WorkspaceUser
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="cassandra_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
     */
    private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $workspace;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
	private $user;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\GroupUser")
     */
    protected $groupUser;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\WorkspaceLevel")
	 */
	private $level;

    /**
     * @ORM\Column(type="cassandra_datetime")
     */
    private $date_added;

    /**
     * @ORM\Column(type="cassandra_datetime", options={"default" : "1970-01-02"})
     */
    private $last_access;

    /**
     * @ORM\Column(type="cassandra_boolean")
     */
    private $isHidden = false;

    /**
     * @ORM\Column(type="cassandra_boolean")
     */
    private $isFavorite = false;

    /**
     * @ORM\Column(type="cassandra_boolean")
     */
    private $hasNotifications = true;

	public function __construct($workspace, $user, $level) {
		$this->workspace = $workspace;
		$this->user = $user;
		$this->level = $level;
		$this->date_added = new \DateTime();
        $this->last_access = new \DateTime();
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
	public function getWorkspace()
	{
		return $this->workspace;
	}

	/**
	 * @return mixed
	 */
	public function getUser()
	{
		return $this->user;
	}

	/**
	 * @return mixed
	 */
	public function getLevel()
	{
		return $this->level;
	}

	/**
	 * @param mixed $level
	 */
	public function setLevel($level)
	{
		$this->level = $level;
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
    public function getGroupUser()
    {
        return $this->groupUser;
    }

    /**
     * @param mixed $groupUser
     */
    public function setGroupUser($groupUser)
    {
        $this->groupUser = $groupUser;
    }

    /**
     * @return mixed
     */
    public function getLastAccess()
    {
        return $this->last_access;
    }

    /**
     * @param mixed $last_access
     */
    public function setLastAccess()
    {
        $this->last_access = new \DateTime();
    }

    /**
     * @return mixed
     */
    public function getisHidden()
    {
        return $this->isHidden;
    }

    /**
     * @param mixed $isHidden
     */
    public function setIsHidden($isHidden)
    {
        $this->isHidden = $isHidden;
    }

    /**
     * @return mixed
     */
    public function getisFavorite()
    {
        return $this->isFavorite;
    }

    /**
     * @param mixed $isFavorite
     */
    public function setIsFavorite($isFavorite)
    {
        $this->isFavorite = $isFavorite;
    }

    /**
     * @return mixed
     */
    public function getHasNotifications()
    {
        return $this->hasNotifications;
    }

    /**
     * @param mixed $hasNotifications
     */
    public function setHasNotifications($hasNotifications)
    {
        $this->hasNotifications = $hasNotifications;
    }


}
