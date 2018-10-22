<?php

namespace WebsiteApi\ProjectBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use WebsiteApi\ObjectLinksBundle\Model\ObjectLinksInterface;

/**
 * Task
 *
 * @ORM\Table(name="board_task",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ProjectBundle\Repository\BoardTaskRepository")
 */

class BoardTask implements ObjectLinksInterface {

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
     * @ORM\Column(type="text")
     */
    private $checklist = "[]";

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
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
     * @ORM\JoinColumn(nullable=true)
     */
    private $workspace;

    /**
     * @ORM\Column(name="like_ts",type="bigint")
     */
    private $like;

    /**
     * @ORM\Column(name="from_ts", type="bigint", nullable=true)
     */
    private $from;

    /**
     * @ORM\Column(name="to_ts", type="bigint", nullable=true)
     */
    private $to;

    /**
     * @ORM\Column( type="text")
     */
    private $userIdToNotify;


    /**
     * @ORM\Column( type="text")
     */
    private $labels;

    /**
     * @ORM\Column( type="text")
     */
    private $participants;

    /**
     * @ORM\Column( type="text")
     */
    private $userWhoLiked;

    /**
     * @ORM\Column( type="text")
     */
    private $userWhoDisliked;

    /**
     * @ORM\Column(type="string", length=264)
     */
    private $name;

    /**
     * @ORM\Column(type="text")
     */
    private $description;

    /**
     * @ORM\Column(type="text", nullable=false)
     */
    private $status = "todo"; //"current" "done" "cancelled"

    public function __construct($from, $to, $name, $description, $dependingTask, $participants, $user, $weight = 0.5)
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
        $this->setUserWhoLiked(Array());
        $this->setUserWhoDisliked(Array());
    }

    public function likeOne($userId){
        $userWhoLike = $this->getUserWhoLiked();
        $userWhoDislike = $this->getUserWhoDisliked();

        if(!in_array($userId,$userWhoLike)) {
            $this->like++;
            if(!in_array($userId,$userWhoDislike))
                $userWhoLike[] = $userId;

            $userWhoDislike = array_diff($userWhoDislike, [$userId]);
            $this->setUserWhoLiked($userWhoLike);
            $this->setUserWhoDisliked($userWhoDislike);
        }
    }

    public function dislikeOne($userId)
    {
        $userWhoLike = $this->getUserWhoLiked();
        $userWhoDislike = $this->getUserWhoDisliked();

        if(!in_array($userId,$userWhoDislike)) {
            $this->like--;
            if(!in_array($userId,$userWhoLike))
                $userWhoDislike[] = $userId;
            $userWhoLike = array_diff($userWhoLike, [$userId]);
            $this->setUserWhoLiked($userWhoLike);
            $this->setUserWhoDisliked($userWhoDislike);
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
        if (intval($from) <= 0) {
            $this->from = null;
            return;
        }
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
        if (intval($to) <= 0) {
            $this->to = null;
            return;
        }
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
            "labels" => $this->getLabels(),
            "user" => $this->getUser() !=null ? $this->getUser()->getId() : 0,
            "status" => $this->getStatus(),
            "progress" => $this->getProgress(),
            "checklist" => $this->getChecklist(),
            "workspace" => $this->getWorkspace() ? $this->getWorkspace()->getId() : null
        );
    }

    public function getAsMinimalArray()
    {
        return Array(
            "id" => $this->getId(),
            "board" => $this->getBoard()->getId(),
            "list" => $this->getListOfTasks()->getId(),
            "weight" => $this->getWeight(),
            "workspace" => $this->getWorkspace() ? $this->getWorkspace()->getId() : null
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
        return $this->weight / 10;
    }

    /**
     * @param mixed $weight
     */
    public function setWeight($weight)
    {
        $this->weight = intval($weight * 10);
    }

    /**
     * @return mixed
     */
    public function getProgress()
    {
        $progress = 0;
        $total = 0;
        foreach ($this->getChecklist() as $row) {
            if (isset($row["value"]) && $row["value"]) {
                $progress += 1;
            }
            $total++;
        }
        if ($total == 0) {
            return $progress = 0;
        }
        return intval(($progress / $total) * 100);
    }

    /**
     * @return mixed
     */
    public function getChecklist()
    {
        @$val = json_decode($this->checklist, 1);
        if (!is_array($val)) {
            $val = Array();
        }
        return $val;
    }

    /**
     * @param mixed $checklist
     */
    public function setChecklist($checklist)
    {
        $this->checklist = json_encode($checklist);
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


    /**
     * @return mixed
     */
    public function getUserWhoDisliked()
    {
        return json_decode($this->userWhoDisliked,1);
    }

    /**
     * @param mixed $userWhoDisliked
     */
    public function setUserWhoDisliked($userWhoDisliked)
    {
        $this->userWhoDisliked = json_encode($userWhoDisliked);
    }
    public function getRepository()
    {
        return "TwakeProjectBundle:BoardTask";
    }

    public function getAsArrayFormated(){
        return Array(
            "id" => $this->getId(),
            "title" => "Task",
            "object_name" => $this->getName(),
            "key" => "tasks",
            "type" => "task",
            "code" => $this->getBoard()->getId() . "/" . $this->getId(),
        );
    }

    public function synchroniseField($fieldName, $value)
    {
        if(!property_exists($this, $fieldName))
            return false;

        $setter = "set".ucfirst($fieldName);
        $this->$setter($value);
        return true;
    }

    public function get($fieldName){
        if(!property_exists($this, $fieldName))
            return false;

        $getter = "get".ucfirst($fieldName);

        return $this->$getter();
    }

    public function getPushRoute()
    {
        if (!$this->getBoard()) {
            return false;
        }
        return "board/" . $this->getBoard()->getId();
    }

    /**
     * @return mixed
     */
    public function getLabels()
    {
        return json_decode($this->labels, 1);
    }

    /**
     * @param mixed $labels
     */
    public function setLabels($labels)
    {
        $this->labels = json_encode($labels);
    }

    /**
     * @return mixed
     */
    public function getStatus()
    {
        return $this->status;
    }

    /**
     * @param mixed $status
     */
    public function setStatus($status)
    {
        $this->status = $status;
    }

    public function getAllUsersToNotify()
    {
        return array_merge($this->getParticipants(),$this->getUserIdToNotify());
    }

    public function finishSynchroniseField($data)
    {
        // TODO: Implement finishSynchroniseField($data) method.
    }

    /**
     * @return mixed
     */
    public function getWorkspace()
    {
        return $this->workspace;
    }

    /**
     * @param mixed $workspace
     */
    public function setWorkspace($workspace)
    {
        $this->workspace = $workspace;
    }


}