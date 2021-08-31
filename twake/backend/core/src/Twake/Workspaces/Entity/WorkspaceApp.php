<?php

namespace Twake\Workspaces\Entity;


use Doctrine\ORM\Mapping as ORM;


/**
 * WorkspaceApp
 *
 * @ORM\Table(name="workspace_app",options={"engine":"MyISAM", "scylladb_keys": {{"workspace_id": "ASC", "groupapp_id": "ASC", "app_id": "ASC", "id":"ASC"}, {"groupapp_id": "ASC"}, {"id":"ASC"}}})
 * @ORM\Entity()
 */
class WorkspaceApp
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="workspace_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $workspace;

    /**
     * @ORM\Column(name="groupapp_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $groupapp_id;

    /**
     * @ORM\Column(name="app_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $app_id;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date_added;

    public function __construct($workspace, $groupapp_id, $app_id)
    {
        $this->workspace = $workspace;
        $this->groupapp_id = $groupapp_id;
        $this->app_id = $app_id;
        $this->date_added = new \DateTime();
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
    public function getWorkspace()
    {
        return $this->workspace;
    }

    /**
     * @return mixed
     */
    public function getGroupApp()
    {
        return $this->groupapp;
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

}
