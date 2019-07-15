<?php

namespace WebsiteApi\TasksBundle\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * TaskBoard
 *
 * @ORM\Table(name="task_board",options={"engine":"MyISAM", "scylladb_keys": {{"workspace_id":"ASC", "board_id": "ASC", "sort_date": "ASC", "id": "ASC"}, {"task_id":"ASC"}} })
 * @ORM\Entity(repositoryClass="WebsiteApi\TasksBundle\Repository\TaskBoardRepository")
 */
class TaskBoard
{

    /**
     * @ORM\Column(name="workspace_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $workspace_id;

    /**
     * @ORM\Column(name="board_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $board_id;

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="sort_date", type="twake_bigint")
     * @ORM\Id
     */
    private $sort_date;

    /**
     * @ORM\Column(name="task_id", type="twake_timeuuid")
     */
    private $task_id;


    public function __construct($workspace_id, $board_id, $task_id, $sort_date)
    {
        $this->workspace_id = $workspace_id;
        $this->board_id = $board_id;
        $this->task_id = $task_id;
        $this->sort_date = $sort_date;
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
     * @return mixed
     */
    public function getBoardId()
    {
        return $this->board_id;
    }

    /**
     * @return mixed
     */
    public function getSortDate()
    {
        return $this->sort_date;
    }

    /**
     * @return mixed
     */
    public function getTaskId()
    {
        return $this->task_id;
    }


}