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
    private $didConnect;

    /**
     * @ORM\Column(name="app_used_today", type="string", length=100000)
     */
    protected $usedApps;

    /**
     * @ORM\Column(name="nb_workspace", type="integer")
     */
    protected $nbWorkspace;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date_added;

    /**
     * @ORM\Column(name="last_update_day", type="integer")
     */
    protected $lastDayOfUpdate;

    /**
     * @ORM\Column(name="nbConnection", type="integer")
     */
    protected $connections;

    /**
     * @ORM\Column(name="app_used_period", type="string", length=100000)
     */
    protected $appsUsage;

	public function __construct($group, $user) {
		$this->group = $group;
		$this->user = $user;
		$this->level = 0;
		$this->date_added = new \DateTime();
		$this->nbWorkspace = 0;
		$this->didConnect = false;
		$this->usedApps = "[]";
		$this->lastDayOfUpdate = date('z')+1;
		$this->connections = 0;
		$this->appsUsage = "[]";
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
        if ($this->lastDayOfUpdate == 0){
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
    public function getConnections()
    {
        return $this->connections;
    }

    /**
     * @param mixed $connections
     */
    public function setConnections($connections)
    {
        $this->connections = $connections;
    }

    /**
     * @return  mixed $connectionPeriod+1
     */
    public function increaseConnectionPeriod()
    {
        return $this->connections = $this->connections+1;
    }

    /**
     * @return mixed
     */
    public function getUsedApps()
    {
        if ($this->usedApps == null){
            return Array();
        }
        return json_decode($this->usedApps, true);
    }

    /**
     * @param mixed $usedApps
     */
    public function setUsedApps($usedApps)
    {
        $this->usedApps = json_encode($usedApps);
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
    public function getAppsUsage()
    {
        if ($this->appsUsage == null){
            return Array();
        }
        return json_decode($this->appsUsage, true);
    }

    /**
     * @param mixed $appsUsage
     */
    public function setAppsUsage($appsUsage)
    {
        $this->appsUsage = json_encode($appsUsage);
    }

    /**
     * @return mixed
     */
    public function getDidConnect()
    {
        if ($this->didConnect == null){
            return false;
        }
        return $this->didConnect;
    }

    /**
     * @param mixed $didConnect
     */
    public function setDidConnect($didConnect)
    {
        $this->didConnect = $didConnect;
    }
}
