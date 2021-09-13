<?php

namespace Twake\Workspaces\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * GroupApp
 *
 * @ORM\Table(name="group_app",options={"engine":"MyISAM", "scylladb_keys": {{"group_id": "ASC", "app_id": "ASC", "id": "ASC"}, {"id":"ASC"}}})
 * @ORM\Entity()
 */
class GroupApp
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Workspaces\Entity\Group")
     * @ORM\Id
     */
    private $group;

    /**
     * @ORM\Column(name="app_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $app_id;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date_added;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $workspacedefault;

    /**
     * @ORM\Column(type="integer")
     */
    private $workspaces_count;

    /**
     * @ORM\Column(name="privileges_capabilities_last_update", type="twake_datetime")
     */
    protected $privileges_capabilities_last_update;

    /**
     * @ORM\Column(name="privileges", type="twake_text")
     */
    protected $privileges = "[]";

    /**
     * @ORM\Column(name="capabilities", type="twake_text")
     */
    protected $capabilities = "[]";

    /**
     * @ORM\Column(name="hooks", type="twake_text")
     */
    protected $hooks = "[]";


    public function __construct($group, $app_id)
    {
        $this->group = $group;
        $this->app_id = $app_id;

        $this->date_added = new \DateTime();
        $this->workspacedefault = false;

        $this->setPrivilegesCapabilitiesLastRead(new \DateTime());
    }


    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "group_id" => $this->getGroup()->getId(),
            "app_id" => $this->getAppId(),
            "date_added" => $this->getDateAdded() ? $this->getDateAdded()->getTimestamp() : null,
            "workspace_default" => $this->getWorkspaceDefault(),
            "workspace_count" => $this->getWorkspacesCount()
        );
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
    public function getGroup()
    {
        return $this->group;
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
    public function getWorkspaceDefault()
    {
        return $this->workspacedefault;
    }

    /**
     * @param mixed $workspacedefault
     */
    public function setWorkspaceDefault($workspacedefault)
    {
        $this->workspacedefault = $workspacedefault;
    }

    /**
     * @return mixed
     */
    public function getAppId()
    {
        return $this->app_id;
    }

    /**
     * @param mixed $app_id
     */
    public function setAppId($app_id)
    {
        $this->app_id = $app_id;
    }

    /**
     * @return mixed
     */
    public function getWorkspacesCount()
    {
        return $this->workspaces_count;
    }

    /**
     * @param mixed $workspaces_count
     */
    public function setWorkspacesCount($workspaces_count)
    {
        $this->workspaces_count = $workspaces_count;
    }

    /**
     * @return mixed
     */
    public function getPrivilegesCapabilitiesLastRead()
    {
        return $this->privileges_capabilities_last_update;
    }

    /**
     * @param mixed $privileges_capabilities_last_update
     */
    public function setPrivilegesCapabilitiesLastRead($privileges_capabilities_last_update)
    {
        $this->privileges_capabilities_last_update = $privileges_capabilities_last_update;
    }

    /**
     * @return mixed
     */
    public function getPrivileges()
    {
        return json_decode($this->privileges, true);
    }

    /**
     * @param mixed $privileges
     */
    public function setPrivileges($privileges)
    {
        $this->privileges = json_encode($privileges);
    }

    /**
     * @return mixed
     */
    public function getCapabilities()
    {
        return json_decode($this->capabilities, true);
    }

    /**
     * @param mixed $capabilities
     */
    public function setCapabilities($capabilities)
    {
        $this->capabilities = json_encode($capabilities);
    }

    /**
     * @return mixed
     */
    public function getHooks()
    {
        if (!$this->hooks) {
            return Array();
        }
        return json_decode($this->hooks, true);
    }

    /**
     * @param mixed $hooks
     */
    public function setHooks($hooks)
    {
        $this->hooks = json_encode($hooks);
    }


}
