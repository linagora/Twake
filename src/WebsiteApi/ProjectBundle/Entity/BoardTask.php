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
     * @ORM\Column(name="order_ts",type="integer")
     */
    private $order;

    /**
     * @ORM\Column(type="integer")
     */
    private $weight;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ProjectBundle\Entity\Board")
     * @ORM\JoinColumn(nullable=true)
     */
    private $board;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ProjectBundle\Entity\ListOfTasks")
     * @ORM\JoinColumn(nullable=true)
     */
    private $listOfTasks;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ProjectBundle\Entity\BoardTask")
     * @ORM\JoinColumn(nullable=true)
     */
    private $dependingTask;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     * @ORM\JoinColumn(nullable=true)
     */
    private $user;

    /**
     * @ORM\Column(name="next_reminder", type="bigint")
     */
    private $nextReminder = 0;

    /**
     * @ORM\Column(name="like_ts",type="bigint")
     */
    private $like;

    /**
     * @ORM\Column(name="from_ts", type="bigint")
     */
    private $from;

    /**
     * @ORM\Column(name="to_ts", type="bigint")
     */
    private $to;

    /**
     * @ORM\Column( type="text")
     */
    private $userIdToNotify;

    /**
     * @ORM\Column( type="text")
     */
    private $participants;

    /**
     * @ORM\Column( type="text")
     */
    private $userWhoLiked;

    /**
     * @ORM\Column(type="string", length=264)
     */
    private $name;

    /**
     * @ORM\Column(type="text")
     */
    private $description;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ProjectBundle\Entity\ListOfTasks",cascade={"persist"})
     */
    private $doneList;

    public  function __construct($from, $to, $name, $description, $dependingTask, $participants, $user, $weight=1)
    {
        $this->setFrom($from);
        $this->setTo($to);
        $this->setReminder();
        $this->setName($name);
        $this->setDescription($description);
        $this->setDependingTask($dependingTask);
        $this->setWeight($weight);
        $this->setParticipants($participants);
        $this->setUser($user);
        $this->setLike(0);
    }

    public function likeOne($userId){
        $userWhoLike = $this->getUserWhoLiked();

        if(!in_array($userId,$userWhoLike)) {
            $this->like++;
            $userWhoLike[] = $userId;
            $this->setUserWhoLiked($userWhoLike);
        }
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
    public function getUserIdToNotify()
    {
        return json_decode($this->userIdToNotify, 1);
    }

    /**
     * @param mixed $task
     */
    public function setUserIdToNotify($task)
    {
        $this->userIdToNotify = json_encode($task);
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
            "list" => $this->getListOfTasks()->getId(),
            "dependingTask" => $this->getDependingTask()!=null ? $this->dependingTask->getId() : null,
            "name" => $this->getName(),
            "description" => $this->getDescription(),
            "watch_members" => $this->getUserIdToNotify(),
            "participants" => $this->getParticipants(),
            "order" => $this->getOrder(),
            "from" => $this->getFrom(),
            "to" => $this->getTo(),
            "weight" => $this->getWeight(),
            "like" => $this->getLike(),
            "user" => $this->getUser() !=null ? $this->getUser()->getId() : 0,
        );
    }

    /**
     * @return mixed
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param mixed $name
     */
    public function setName($name)
    {
        $this->name = $name;
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
    public function getDependingTask()
    {
        return $this->dependingTask;
    }

    /**
     * @param mixed $dependingTask
     */
    public function setDependingTask($dependingTask)
    {
        $this->dependingTask = $dependingTask;
    }

    /**
     * @return ListOfTasks
     */
    public function getListOfTasks()
    {
        return $this->listOfTasks;
    }

    /**
     * @param mixed $listOfTasks
     */
    public function setListOfTasks($listOfTasks)
    {
        $this->listOfTasks = $listOfTasks;
    }

    /**
     * @return mixed
     */
    public function getDoneList()
    {
        return $this->doneList;
    }

    /**
     * @param mixed $doneList
     */
    public function setDoneList($doneList)
    {
        $this->doneList = $doneList;
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
    public function getWeight()
    {
        return $this->weight;
    }

    /**
     * @param mixed $weight
     */
    public function setWeight($weight)
    {
        $this->weight = $weight;
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
    public function getParticipants()
    {
        return json_decode($this->participants,1);
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
    public function getLike()
    {
        return $this->like;
    }

    /**
     * @param mixed $like
     */
    public function setLike($like)
    {
        $this->like = $like;
    }

    /**
     * @return mixed
     */
    public function getUserWhoLiked()
    {
        return json_decode($this->userWhoLiked,1);
    }

    /**
     * @param mixed $userWhoLiked
     */
    public function setUserWhoLiked($userWhoLiked)
    {
        $this->userWhoLiked = json_encode($userWhoLiked);
    }


}