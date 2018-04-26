<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;




/**
 * GroupUser
 *
 * @ORM\Table(name="group_user",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\GroupUserRepository")
 */
class GroupUser
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
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
	protected $user;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
	 */
	protected $group;

	/**
	 * @ORM\Column(name="level", type="integer")
	 */
	protected $level;

    /**
     * @ORM\Column(type="boolean")
     */
    private $connected_today;

    /**
     * @ORM\Column(name="app_used_today", type="string", length=100000)
     */
    protected $apps;

    /**
     * @ORM\Column(name="nb_workspace", type="integer")
     */
    protected $nbWorkspace;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date_added;

    /**
     * @ORM\Column(name="update_day", type="integer")
     */
    protected $lastDayOfUpdate;

    /**
     * @ORM\Column(name="connection_period", type="integer")
     */
    protected $connectionPeriod;

    /**
     * @ORM\Column(name="app_used_period", type="string", length=100000)
     */
    protected $appsUsagePeriod;

	public function __construct($group, $user) {
		$this->group = $group;
		$this->user = $user;
		$this->level = 0;
		$this->date_added = new \DateTime();
		$this->nbWorkspace = 0;
		$this->connected_today = false;
		$this->apps = "[]";
		$this->lastDayOfUpdate = date('z')+1;
		$this->connectionPeriod = 0;
		$this->appsUsagePeriod = "[]";
	}

	public function getId(){
		return $this->id;
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
    public function getNbWorkspace()
    {
        return $this->nbWorkspace;
    }

    /**
     * @return mixed
     */
    public function getLastDayOfUpdate()
    {
        if ($this->lastDayOfUpdate == null){
            return date('z')+1;
        }
        return $this->lastDayOfUpdate;
    }

    /**
     * @param mixed $lastDayOfUpdate
     */
    public function setLastDayOfUpdate($lastDayOfUpdate)
    {
        $this->lastDayOfUpdate = $lastDayOfUpdate;
    }

    /**
     * @return mixed
     */
    public function getConnectionPeriod()
    {
        if ($this->connectionPeriod == null){
            return 0;
        }
        return $this->connectionPeriod;
    }

    /**
     * @param mixed $connectionPeriod
     */
    public function setConnectionPeriod($connectionPeriod)
    {
        $this->connectionPeriod = $connectionPeriod;
    }

    /**
     * @return  mixed $connectionPeriod+1
     */
    public function increaseConnectionPeriod()
    {
        return $this->connectionPeriod = $this->connectionPeriod+1;
    }

    /**
     * @return mixed
     */
    public function getApps()
    {
        if ($this->apps == null){
            return Array();
        }
        return json_decode($this->apps, true);
    }

    /**
     * @param mixed $apps
     */
    public function setApps($apps)
    {
        $this->apps = json_encode($apps);
    }


    /**
     * @param mixed $nbWorkspace
     */
    public function setNbWorkspace($nbWorkspace)
    {
        $this->nbWorkspace = $nbWorkspace;
    }

    public function increaseNbWorkspace()
    {
        return $this->nbWorkspace = $this->nbWorkspace+1;
    }

    public function decreaseNbWorkspace()
    {
        return $this->nbWorkspace = $this->nbWorkspace-1;
    }

    /**
     * @return mixed
     */
    public function getAppsUsagePeriod()
    {
        if ($this->appsUsagePeriod == null){
            return Array();
        }
        return json_decode($this->appsUsagePeriod, true);
    }

    /**
     * @param mixed $appsUsagePeriod
     */
    public function setAppsUsagePeriod($appsUsagePeriod)
    {
        $this->appsUsagePeriod = json_encode($appsUsagePeriod);
    }

    /**
     * @return mixed
     */
    public function getConnectedToday()
    {
        if ($this->connected_today == null){
            return false;
        }
        return $this->connected_today;
    }

    /**
     * @param mixed $connected_today
     */
    public function setConnectedToday($connected_today)
    {
        $this->connected_today = $connected_today;
    }
}
