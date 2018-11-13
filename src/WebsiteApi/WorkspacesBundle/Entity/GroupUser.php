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
     * @ORM\Column(name="id", type="cassandra_timeuuid")
	 * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
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
     * @ORM\Column(name="did_connect_today", type="boolean")
     */
    private $didConnectToday;

    /**
     * @ORM\Column(name="is_externe", type="boolean")
     */
    private $externe;

    /**
     * @ORM\Column(name="app_used_today", type="string", length=100000)
     */
    protected $usedAppsToday;

    /**
     * @ORM\Column(name="nb_workspace", type="integer")
     */
    protected $nbWorkspace;

	/**
     * @ORM\Column(type="cassandra_datetime")
	 */
	private $date_added;

    /**
     * @ORM\Column(name="last_update_day", type="integer")
     */
    protected $lastDayOfUpdate;

    /**
     * @ORM\Column(name="nb_connections_period", type="integer")
     */
    protected $connectionsPeriod;

    /**
     * @ORM\Column(name="app_used_period", type="string", length=100000)
     */
    protected $appsUsage_period;

	public function __construct($group, $user) {
		$this->group = $group;
		$this->user = $user;
		$this->level = 0;
		$this->date_added = new \DateTime();
		$this->nbWorkspace = 0;
        $this->didConnectToday = false;
        $this->usedAppsToday = "[]";
		$this->lastDayOfUpdate = date('z')+1;
        $this->connectionsPeriod = 0;
        $this->appsUsage_period = "[]";
        $this->externe = false;
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
    public function getConnectionsPeriod()
    {
        return $this->connectionsPeriod;
    }

    /**
     * @param mixed $connectionsPeriod
     */
    public function setConnectionsPeriod($connectionsPeriod)
    {
        $this->connectionsPeriod = $connectionsPeriod;
    }

    /**
     * @return  mixed $connectionPeriod+1
     */
    public function increaseConnectionsPeriod()
    {
        return $this->connectionsPeriod = $this->connectionsPeriod + 1;
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
        if ($this->nbWorkspace == 0){
            return $this->nbWorkspace;
        }else{
            return $this->nbWorkspace = $this->nbWorkspace-1;
        }
    }

    /**
     * @return mixed
     */
    public function getLastDayOfUpdate()
    {
        if ($this->lastDayOfUpdate == 0) {
            return date('z') + 1;
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
    public function getAppsUsagePeriod()
    {
        if ($this->appsUsage_period == null) {
            return Array();
        }
        return json_decode($this->appsUsage_period, true);
    }

    /**
     * @param mixed $appsUsage_period
     */
    public function setAppsUsagePeriod($appsUsage_period)
    {
        $this->appsUsage_period = json_encode($appsUsage_period);
    }

    /**
     * @return mixed
     */
    public function getUsedAppsToday()
    {
        if ($this->usedAppsToday == null) {
            return Array();
        }
        return json_decode($this->usedAppsToday, true);
    }

    /**
     * @param mixed $usedApps
     */
    public function setUsedAppsToday($usedApps)
    {
        $this->usedAppsToday = json_encode($usedApps);
    }

    /**
     * @return mixed
     */
    public function getDidConnectToday()
    {
        if ($this->didConnectToday == null) {
            return false;
        }
        return $this->didConnectToday;
    }

    /**
     * @param mixed $didConnectToday
     */
    public function setDidConnectToday($didConnectToday)
    {
        $this->didConnectToday = $didConnectToday;
    }

    /**
     * @return mixed
     */
    public function getExterne()
    {
        return $this->externe;
    }

    /**
     * @param mixed $isClient
     */
    public function setExterne($externe)
    {
        $this->externe = $externe;
    }


}
