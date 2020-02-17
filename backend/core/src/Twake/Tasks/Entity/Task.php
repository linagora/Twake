<?php

namespace Twake\Tasks\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;

use Twake\Core\Entity\FrontObject;
use Twake\Core\Entity\SearchableObject;

/**
 * Task
 *
 * @ORM\Table(name="tasks_task",options={"engine":"MyISAM", "scylladb_keys": {{"board_id":"ASC", "id":"ASC"}, {"id":"ASC"}, {"list_id":"ASC"}} })
 * @ORM\Entity()
 */
class Task extends SearchableObject
{
    protected $es_type = "task";

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
     */
    private $list_id;

    /**
     * @ORM\Column(name="order_pos", type="twake_text", nullable=true)
     */
    private $order;

    /**
     * @ORM\Column(name="before", type="twake_bigint")
     */
    private $before = 0;

    /**
     * @ORM\Column(name="start_time", type="twake_bigint")
     */
    private $start_time = 0;

    /**
     * @ORM\Column(name="title", type="twake_text")
     */
    private $title = "";

    /**
     * @ORM\Column(name="description", type="twake_text", nullable=true)
     */
    private $description = "";

    /**
     * @ORM\Column(name="owner", type="twake_no_salt_text")
     */
    private $owner;

    /**
     * @ORM\Column(name="task_created_at", type="twake_bigint")
     */
    private $task_created_at;

    /**
     * @ORM\Column(name="check_list", type="twake_text")
     */
    private $check_list = "{}";

    /**
     * @ORM\Column(name="participants", type="twake_text")
     */
    private $participants = "{}";

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

    /**
     * @ORM\Column(name="archived", type="twake_boolean")
     */
    private $archived;

    /**
     * @ORM\Column(name="workspace_id", type="twake_timeuuid")
     */
    protected $workspace_id;


    /**
     * @ORM\Column(name="attachements", type="twake_text")
     */
    private $attachements = "[]";


    public function __construct($board_id, $list_id, $title)
    {
        $this->setTitle($title);
        $this->setBoardId($board_id);
        $this->setListId($list_id);
        $this->setTaskLastModified();
        $this->setTaskCreatedAt(date("U"));
    }

    public function getIndexationArray()
    {
        $participants = [];
        foreach ($this->getParticipants() as $p) {
            $participants[] = $p["user_id_or_mail"];
        }

        return Array(
            "id" => $this->getId() . "",
            "title" => $this->getTitle(),
            "description" => $this->getDescription(),
            "owner" => $this->getOwner(),
            "tags" => $this->getTags(),
            'before' => ($this->getBefore() ? date('Y-m-d', $this->getBefore()) : null),
            'start' => ($this->getStartTime() ? date('Y-m-d', $this->getStartTime()) : null),
            'date_created' => ($this->getTaskCreatedAt() ? date('Y-m-d', $this->getTaskCreatedAt()) : null),
            "date_last_modified" => ($this->getTaskLastModified() ? date('Y-m-d', $this->getTaskLastModified()) : null),
            "workspace_id" => $this->getWorkspaceId(),
            "participants" => $participants
        );

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
     * @return string
     */
    public function getEsType()
    {
        return $this->es_type;
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
        try {
            return json_decode($this->description, 1);
        } catch (\Exception $e) {

        }
        return $this->description;
    }

    /**
     * @param mixed $description
     */
    public function setDescription($description)
    {
        $this->description = json_encode($description);
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

    /**
     * @return mixed
     */
    public function getBoardId()
    {
        return $this->board_id;
    }

    /**
     * @param mixed $board_id
     */
    public function setBoardId($board_id)
    {
        $this->board_id = $board_id;
    }

    /**
     * @return mixed
     */
    public function getListId()
    {
        return $this->list_id;
    }

    /**
     * @param mixed $list_id
     */
    public function setListId($list_id)
    {
        $this->list_id = $list_id;
    }

    /**
     * @return mixed
     */
    public function getOrder()
    {
        return $this->order;
    }

    /**
     * @param mixed $order
     */
    public function setOrder($order)
    {
        $this->order = $order;
    }

    /**
     * @return mixed
     */
    public function getBefore()
    {
        return $this->before;
    }

    /**
     * @param mixed $before
     */
    public function setBefore($before)
    {
        $this->before = $before;
    }

    /**
     * @return mixed
     */
    public function getStartTime()
    {
        return $this->start_time;
    }

    /**
     * @param mixed $before
     */
    public function setStartTime($start_time)
    {
        $this->start_time = $start_time;
    }

    /**
     * @return mixed
     */
    public function getTaskCreatedAt()
    {
        return $this->task_created_at;
    }

    /**
     * @param mixed $task_created_at
     */
    public function setTaskCreatedAt($task_created_at)
    {
        $this->task_created_at = $task_created_at;
    }

    /**
     * @return mixed
     */
    public function getCheckList()
    {
        return json_decode($this->check_list, 1);
    }

    /**
     * @param mixed $check_list
     */
    public function setCheckList($check_list)
    {
        $this->check_list = json_encode($check_list);
    }

    /**
     * @return mixed
     */
    public function getArchived()
    {
        return $this->archived;
    }

    /**
     * @param mixed $archived
     */
    public function setArchived($archived)
    {
        $this->archived = $archived;
    }

    /**
     * @return mixed
     */
    public function getAttachements()
    {
        return json_decode($this->attachements, true);
    }

    /**
     * @param mixed $tags
     */
    public function setAttachements($attachements)
    {
        $this->attachements = json_encode($attachements);
    }

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "front_id" => $this->getFrontId(),
            "board_id" => $this->getBoardId(),
            "list_id" => $this->getListId(),
            "owner" => $this->getOwner(),
            "task_created_at" => $this->getTaskCreatedAt(),
            "task_last_modified" => $this->getTaskLastModified(),
            "archived" => !!$this->getArchived(),
            "before" => $this->getBefore(),
            "start" => $this->getStartTime(),
            "title" => $this->getTitle(),
            "description" => $this->getDescription(),
            "checklist" => $this->getCheckList(),
            "order" => $this->getOrder(),
            "participants" => $this->getParticipants(),
            "notifications" => $this->getNotifications(),
            "tags" => $this->getTags(),
            "workspace_id" => $this->getWorkspaceId(),
            "attachments" => $this->getAttachements()
        );
    }


}