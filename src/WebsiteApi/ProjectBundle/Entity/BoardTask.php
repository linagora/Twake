<?php

namespace WebsiteApi\ProjectBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Task
 *
 * @ORM\Table(name="board_task",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ProjectBundle\Repository\BoardTaskRepository")
 */

class BoardTask {

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ProjectBundle\Entity\Board")
     * @ORM\JoinColumn(nullable=true)
     */
    private $board;

    /**
     * @ORM\Column(name="next_reminder", type="bigint")
     */
    private $nextReminder = 0;

    /**
     * @ORM\Column(name="from_ts", type="bigint")
     */
    private $from;

    /**
     * @ORM\Column(name="to_ts", type="bigint")
     */
    private $to;

    /**
     * @ORM\Column(name="task_json", type="text")
     */
    private $task;

    /**
     * @ORM\Column(name="participant", type="text")
     */
    private $participant;

    public  function __construct($task, $from, $to)
    {
        $this->setTask($task);
        $this->setFrom($from);
        $this->setTo($to);
        $this->setReminder();
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param int $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getBoard()
    {
        return $this->board;
    }

    /**
     * @param mixed $board
     */
    public function setBoard($board)
    {
        $this->board = $board;
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
    public function getTask()
    {
        return json_decode($this->task, 1);
    }

    /**
     * @param mixed $task
     */
    public function setTask($task)
    {
        $this->task = json_encode($task);
    }

    /**
     * @return mixed
     */
    public function getParticipant()
    {
        return json_decode($this->participant, 1);
    }

    /**
     * @param mixed $task
     */
    public function setParticipant($task)
    {
        $this->participant = json_encode($task);
    }

    /**
     * @return mixed
     */
    public function getNextReminder()
    {
        return $this->nextReminder;
    }

    /**
     * @param mixed $nextReminder
     */
    public function setNextReminder($nextReminder)
    {
        $this->nextReminder = $nextReminder;
    }

    public function setReminder($delay = 1800)
    {
        if ($this->getFrom() < date("U")) {
            $this->setNextReminder(0);
            return;
        }
        $this->setNextReminder(
            $this->getFrom() - $delay
        );
    }

    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "board" => $this->getBoard()->getId(),
            "task" => $this->getTask(),
            "participant" => $this->getParticipant(),
        );
    }


}