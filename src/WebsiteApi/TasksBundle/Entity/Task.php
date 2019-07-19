<?php

namespace WebsiteApi\TasksBundle\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use WebsiteApi\CoreBundle\Entity\FrontObject;

/**
 * Task
 *
 * @ORM\Table(name="task",options={"engine":"MyISAM", "scylladb_keys": {{"board_id":"ASC", "list_id":"ASC", "id":"ASC"}, {"id":"ASC"}} })
 * @ORM\Entity(repositoryClass="WebsiteApi\TasksBundle\Repository\TaskRepository")
 */
class Task extends FrontObject
{

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;


    /**
     * @ORM\Column(name="board_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $board_id;

    /**
     * @ORM\Column(name="list_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $list_id;

    /**
     * @ORM\Column(name="order_pos", type="twake_text", nullable=true)
     */
    private $order;

    /**
     * @ORM\Column(name="from_ts", type="twake_bigint")
     */
    private $from;

    /**
     * @ORM\Column(name="to_ts", type="twake_bigint")
     */
    private $to;

    /**
     * @ORM\Column(name="all_day", type="twake_boolean")
     */
    private $all_day = false;

    /**
     * @ORM\Column(name="type", type="twake_text")
     */
    private $type = "task";

    /**
     * @ORM\Column(name="repetition_definition", type="twake_text")
     */
    private $repetition_definition = "{}";

    /**
     * @ORM\Column(name="title", type="twake_text")
     */
    private $title = "";

    /**
     * @ORM\Column(name="description", type="twake_text", nullable=true)
     */
    private $description = "";

    /**
     * @ORM\Column(name="location", type="twake_text", nullable=true)
     */
    private $location = "";

    /**
     * @ORM\Column(name="private", type="twake_boolean")
     */
    private $private = false;

    /**
     * @ORM\Column(name="available", type="twake_boolean")
     */
    private $available = false;

    /**
     * @ORM\Column(name="owner", type="twake_text")
     */
    private $owner;

    /**
     * @ORM\Column(name="participants", type="twake_text")
     */
    private $participants = "{}";

    /**
     * @ORM\Column(name="workspaces_boards", type="twake_text")
     */
    private $workspaces_boards = "{}";

    /**
     * @ORM\Column(name="notifications", type="twake_text")
     */
    private $notifications = "{}";

    /**
     * @ORM\Column(name="tags", type="twake_text")
     */
    private $tags = "{}";

    /**
     * @ORM\Column(name="task_last_modified", type="twake_bigint")
     */
    private $task_last_modified;


    public function __construct($board_id, $list_id, $title)
    {
        $this->setTitle($title);
        $this->setTaskLastModified();
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
    public function getFrom()
    {
        return $this->from;
    }

    /**
     * @param mixed $from
     */
    public function setFrom($from)
    {
        $this->from = $from;
    }

    /**
     * @return mixed
     */
    public function getTo()
    {
        return $this->to;
    }

    /**
     * @param mixed $to
     */
    public function setTo($to)
    {
        $this->to = $to;
    }

    /**
     * @return mixed
     */
    public function getAllDay()
    {
        return $this->all_day;
    }

    /**
     * @param mixed $all_day
     */
    public function setAllDay($all_day)
    {
        $this->all_day = $all_day;
    }

    /**
     * @return mixed
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * @param mixed $type
     */
    public function setType($type)
    {
        $this->type = $type;
    }

    /**
     * @return mixed
     */
    public function getRepetitionDefinition()
    {
        return json_decode($this->repetition_definition, true);
    }

    /**
     * @param mixed $repetition_definition
     */
    public function setRepetitionDefinition($repetition_definition)
    {
        $this->repetition_definition = json_encode($repetition_definition);
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
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * @param mixed $description
     */
    public function setDescription($description)
    {
        $this->description = $description;
    }

    /**
     * @return mixed
     */
    public function getLocation()
    {
        return $this->location;
    }

    /**
     * @param mixed $location
     */
    public function setLocation($location)
    {
        $this->location = $location;
    }

    /**
     * @return mixed
     */
    public function getPrivate()
    {
        return $this->private;
    }

    /**
     * @param mixed $private
     */
    public function setPrivate($private)
    {
        $this->private = $private;
    }

    /**
     * @return mixed
     */
    public function getAvailable()
    {
        return $this->available;
    }

    /**
     * @param mixed $available
     */
    public function setAvailable($available)
    {
        $this->available = $available;
    }

    /**
     * @return mixed
     */
    public function getOwner()
    {
        return $this->owner;
    }

    /**
     * @param mixed $owner
     */
    public function setOwner($owner)
    {
        $this->owner = $owner;
    }

    /**
     * @return mixed
     */
    public function getParticipants()
    {
        return json_decode($this->participants, true);
    }

    /**
     * @param mixed $participants
     */
    public function setParticipants($participants)
    {
        $this->participants = json_encode($participants);
    }

    /**
     * @return mixed
     */
    public function getWorkspacesBoards()
    {
        return json_decode($this->workspaces_boards, true);
    }

    /**
     * @param mixed $workspaces_boards
     */
    public function setWorkspacesBoards($workspaces_boards)
    {
        $this->workspaces_boards = json_encode($workspaces_boards);
    }

    /**
     * @return mixed
     */
    public function getNotifications()
    {
        return json_decode($this->notifications, true);
    }

    /**
     * @param mixed $notifications
     */
    public function setNotifications($notifications)
    {
        $this->notifications = json_encode($notifications);
    }

    /**
     * @return mixed
     */
    public function getTags()
    {
        return json_decode($this->tags, true);
    }

    /**
     * @param mixed $tags
     */
    public function setTags($tags)
    {
        $this->tags = json_encode($tags);
    }

    public function getSortKey()
    {
        $after_sort_date = floor($this->getFrom() / (60 * 60 * 24 * 7));
        $before_sort_date = floor($this->getTo() / (60 * 60 * 24 * 7));
        $sort_key = [$after_sort_date];
        if ($after_sort_date != $before_sort_date) {
            $sort_key = [$after_sort_date, $before_sort_date];
        }
        return $sort_key;
    }

    /**
     * @return mixed
     */
    public function getTaskLastModified()
    {
        return $this->task_last_modified;
    }

    /**
     * @param mixed $task_last_modified
     */
    public function setTaskLastModified()
    {
        $this->task_last_modified = date("U");
    }


    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "front_id" => $this->getFrontId(),
            "from" => $this->getFrom(),
            "to" => $this->getTo(),
            "all_day" => $this->getAllDay(),
            "repetition_definition" => $this->getRepetitionDefinition(),
            "type" => $this->getType(),
            "title" => $this->getTitle(),
            "description" => $this->getDescription(),
            "location" => $this->getLocation(),
            "private" => $this->getPrivate(),
            "available" => $this->getAvailable(),
            "owner" => $this->getOwner(),
            "participants" => $this->getParticipants(),
            "workspaces_boards" => $this->getWorkspacesBoards(),
            "notifications" => $this->getNotifications(),
            "tags" => $this->getTags(),
            "task_last_modified" => $this->getTaskLastModified()
        );
    }


}