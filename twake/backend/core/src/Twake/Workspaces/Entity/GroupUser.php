<?php

namespace Twake\Workspaces\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * GroupUser
 *
 * @ORM\Table(name="group_user",options={"engine":"MyISAM", "scylladb_keys": {{"group_id":"ASC", "user_id":"DESC", "id":"ASC"}  , {"user_id":"DESC"}}})
 * @ORM\Entity()
 */
class GroupUser
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $id;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Users\Entity\User")
     * @ORM\Id
     */
    protected $user;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Workspaces\Entity\Group")
     * @ORM\Id
     */
    protected $group;

    /**
     * @ORM\Column(name="level", type="integer")
     */
    protected $level;

    /**
     * @ORM\Column(name="did_connect_today", type="twake_boolean")
     */
    private $didconnecttoday;

    /**
     * @ORM\Column(name="is_externe", type="twake_boolean")
     */
    private $externe;

    /**
     * @ORM\Column(name="role", type="string", length=10)
     */
    private $role = "member"; //"guest" | "admin" | "member"

    /**
     * @ORM\Column(name="app_used_today", type="string", length=100000)
     */
    protected $usedappstoday;

    /**
     * @ORM\Column(name="nb_workspace", type="integer")
     */
    protected $nbworkspace;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date_added;

    /**
     * @ORM\Column(name="last_update_day", type="integer")
     */
    protected $lastdayofupdate;

    /**
     * @ORM\Column(name="nb_connections_period", type="integer")
     */
    protected $connectionsperiod;

    /**
     * @ORM\Column(name="app_used_period", type="string", length=100000)
     */
    protected $appsusage_period;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $hasnotifications = false;

    public function __construct($group, $user)
    {
        $this->group = $group;
        $this->user = $user;

        $this->level = 0;
        $this->date_added = new \DateTime();
        $this->nbworkspace = 0;
        $this->didconnecttoday = false;
        $this->usedappstoday = "[]";
        $this->lastdayofupdate = date('z') + 1;
        $this->connectionsperiod = 0;
        $this->appsusage_period = "[]";
        $this->externe = false;
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
    public function getUser()
    {
        return $this->user;
    }

    /**
     * @return mixed
     */
    public function getGroup()
    {
        return $this->group;
    }

    /**
     * @return mixed
     */
    public function getLevel()
    {
        if($this->getRole() == "admin" || $this->getRole() == "owner"){
            return 2;
        }
        if($this->getRole() == "member"){
            return 1;
        }
        if($this->getRole() == "guest"){
            return 0;
        }
        return $this->level;
    }

    /**
     * @param mixed $level
     */
    public function setLevel($level)
    {
        if($level > 1){
            $this->setRole("admin");
        }else if($this->getRole() !== "guest"){
            $this->setRole("member");
        }
        $this->level = $level;
    }

    /**
     * @return mixed
     */
    public function getRole()
    {
        return $this->role;
    }

    /**
     * @param mixed $level
     */
    public function setRole($role)
    {
        $this->role = $role;
    }

    /**
     * @return mixed
     */
    public function getNbWorkspace()
    {
        return $this->nbworkspace;
    }

    /**
     * @return mixed
     */
    public function getConnectionsPeriod()
    {
        return $this->connectionsperiod;
    }

    /**
     * @param mixed $connectionsperiod
     */
    public function setConnectionsPeriod($connectionsperiod)
    {
        $this->connectionsperiod = $connectionsperiod;
    }

    /**
     * @return  mixed $connectionPeriod+1
     */
    public function increaseConnectionsPeriod()
    {
        return $this->connectionsperiod = $this->connectionsperiod + 1;
    }


    /**
     * @param mixed $nbworkspace
     */
    public function setNbWorkspace($nbworkspace)
    {
        $this->nbworkspace = $nbworkspace;
    }

    public function increaseNbWorkspace()
    {
        return $this->nbworkspace = $this->nbworkspace + 1;
    }

    public function decreaseNbWorkspace()
    {
        if ($this->nbworkspace == 0) {
            return $this->nbworkspace;
        } else {
            return $this->nbworkspace = $this->nbworkspace - 1;
        }
    }

    /**
     * @return mixed
     */
    public function getLastDayOfUpdate()
    {
        if ($this->lastdayofupdate == 0) {
            return date('z') + 1;
        }
        return $this->lastdayofupdate;
    }

    /**
     * @param mixed $lastdayofupdate
     */
    public function setLastDayOfUpdate($lastdayofupdate)
    {
        $this->lastdayofupdate = $lastdayofupdate;
    }

    /**
     * @return mixed
     */
    public function getAppsUsagePeriod()
    {
        if ($this->appsusage_period == null) {
            return Array();
        }
        return json_decode($this->appsusage_period, true);
    }

    /**
     * @param mixed $appsusage_period
     */
    public function setAppsUsagePeriod($appsusage_period)
    {
        $this->appsusage_period = json_encode($appsusage_period);
    }

    /**
     * @return mixed
     */
    public function getUsedAppsToday()
    {
        if ($this->usedappstoday == null) {
            return Array();
        }
        return json_decode($this->usedappstoday, true);
    }

    /**
     * @param mixed $usedapps
     */
    public function setUsedAppsToday($usedapps)
    {
        $this->usedappstoday = json_encode($usedapps);
    }

    /**
     * @return mixed
     */
    public function getDidConnectToday()
    {
        if ($this->didconnecttoday == null) {
            return false;
        }
        return $this->didconnecttoday;
    }

    /**
     * @param mixed $didconnecttoday
     */
    public function setDidConnectToday($didconnecttoday)
    {
        $this->didconnecttoday = $didconnecttoday;
    }

    /**
     * @return mixed
     */
    public function getExterne()
    {
        return $this->externe;
    }

    /**
     * @param mixed $isclient
     */
    public function setExterne($externe)
    {
        if($externe){
            $this->setRole("guest");
        }
        $this->externe = $externe;
    }

    /**
     * @return mixed
     */
    public function getHasNotifications()
    {
        return $this->hasnotifications;
    }

    /**
     * @param mixed $hasnotifications
     */
    public function setHasNotifications($hasnotifications)
    {
        $this->hasnotifications = $hasnotifications;
    }


}
