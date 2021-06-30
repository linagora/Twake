<?php

namespace Twake\Tasks\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;

use Twake\Core\Entity\FrontObject;

/**
 * Board
 *
 * @ORM\Table(name="board",options={"engine":"MyISAM", "scylladb_keys": {{"workspace_id":"ASC", "id":"ASC"}, {"id":"ASC"}} })
 * @ORM\Entity()
 */
class Board extends FrontObject
{

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="workspace_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $workspace_id;

    /**
     * @ORM\Column(name="title", type="twake_text", nullable=true)
     */
    private $title;

    /**
     * @ORM\Column(name="emoji", type="string", nullable=true)
     */
    private $emoji;

    /**
     * @ORM\Column(name="group_name", type="twake_no_salt_text", nullable=true)
     */
    private $group_name;

    /**
     * @ORM\Column(name="active_tasks", type="integer", nullable=true)
     */
    private $active_tasks;

    /**
     * @ORM\Column(name="view_mode", type="twake_text", nullable=true)
     */
    private $view_mode = "grid";

    /**
     * @ORM\Column(name="connectors", type="twake_text", nullable=true)
     */
    private $connectors = "[]";

    /**
     * @ORM\Column(name="deleted", type="twake_boolean")
     */
    private $deleted = false;


    public function __construct($workspace_id, $title)
    {
        $this->setWorkspaceId($workspace_id);
        $this->setTitle($title);
    }

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getWorkspaceId()
    {
        return $this->workspace_id;
    }

    /**
     * @param mixed $workspace_id
     */
    public function setWorkspaceId($workspace_id)
    {
        $this->workspace_id = $workspace_id;
    }

    /**
     * @return mixed
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * @param mixed $title
     */
    public function setTitle($title)
    {
        $this->title = $title;
    }

    /**
     * @return mixed
     */
    public function getConnectors()
    {
        return json_decode($this->connectors, 1);
    }

    /**
     * @param mixed $tabs
     */
    public function setConnectors($connectors)
    {
        $this->connectors = json_encode($connectors);
    }

    /**
     * @return mixed
     */
    public function getEmoji()
    {
        return $this->emoji;
    }

    /**
     * @param mixed $emoji
     */
    public function setEmoji($emoji)
    {
        $this->emoji = $emoji;
    }

    /**
     * @return mixed
     */
    public function getActiveTasks()
    {
        return $this->active_tasks ? $this->active_tasks : 0;
    }

    /**
     * @param mixed $active_tasks
     */
    public function setActiveTasks($active_tasks)
    {
        $this->active_tasks = $active_tasks;
    }

    /**
     * @return mixed
     */
    public function getGroupName()
    {
        return $this->group_name;
    }

    /**
     * @param mixed $group_name
     */
    public function setGroupName($group_name)
    {
        $this->group_name = $group_name;
    }

    /**
     * @return mixed
     */
    public function getViewMode()
    {
        return $this->view_mode;
    }

    /**
     * @param mixed $view_mode
     */
    public function setViewMode($view_mode)
    {
        $this->view_mode = $view_mode;
    }

    public function getDeleted()
    {
        return $this->deleted;
    }
    
    public function setDeleted($deleted)
    {
        $this->deleted = $deleted;
    }

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "front_id" => $this->getFrontId(),
            "title" => $this->getTitle(),
            "emoji" => $this->getEmoji(),
            "group_name" => $this->getGroupName(),
            "view_mode" => $this->getViewMode(),
            "active_tasks" => $this->getActiveTasks(),
            "connectors" => $this->getConnectors(),
            "workspace_id" => $this->getWorkspaceId()
        );
    }


}