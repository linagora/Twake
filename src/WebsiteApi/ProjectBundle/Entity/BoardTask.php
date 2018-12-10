<?php

namespace WebsiteApi\ProjectBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
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
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
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
    private $listoftasks;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ProjectBundle\Entity\BoardTask")
     * @ORM\JoinColumn(nullable=true)
     */
    private $dependingtask;

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
     * @Encrypted
     */
    private $useridtonotify;


    /**
     * @ORM\Column( type="text")
     * @Encrypted
     */
    private $labels;

    /**
     * @ORM\Column( type="text")
     * @Encrypted
     */
    private $participants;

    /**
     * @ORM\Column( type="text")
     * @Encrypted
     */
    private $userwholiked;

    /**
     * @ORM\Column( type="text")
     * @Encrypted
     */
    private $userwhodisliked;

    /**
     * @ORM\Column(type="string", length=264)
     */
    private $name;

    /**
     * @ORM\Column(type="text")
     * @Encrypted
     */
    private $description;

    /**
     * @ORM\Column(type="text", nullable=true)
     * @Encrypted
     */
    private $object_link_cache;

    /**
     * @ORM\Column(type="text", nullable=false)
     */
    private $status = "todo"; //"current" "done" "cancelled"

    public function __construct($from, $to, $name, $description, $dependingtask, $participants, $user, $weight = 0.5)
    {
        $this->setFrom($from);
        $this->setTo($to);
        $this->setReminder();
        $this->setName($name);
        $this->setDescription($description);
        $this->setDependingTask($dependingtask);
        $this->setWeight($weight);
        $this->setParticipants($participants);
        $this->setUser($user);
        $this->setLike(0);
        $this->setUserWhoLiked(Array());
        $this->setUserWhoDisliked(Array());
    }

    public function likeOne($userid)
    {
        $userwholike = $this->getUserWhoLiked();
        $userwhodislike = $this->getUserWhoDisliked();

        if (!in_array($userid, $userwholike)) {
            $this->like++;
            if (!in_array($userid, $userwhodislike))
                $userWhoLike[] = $userid;

            $userwhodislike = array_diff($userwhodislike, [$userId]);
            $this->setUserWhoLiked($userwholike);
            $this->setUserWhoDisliked($userwhodislike);
        }
    }

    public function dislikeOne($userid)
    {
        $userwholike = $this->getUserWhoLiked();
        $userwhodislike = $this->getUserWhoDisliked();

        if (!in_array($userid, $userwhodislike)) {
            $this->like--;
            if (!in_array($userid, $userwholike))
                $userWhoDislike[] = $userid;
            $userwholike = array_diff($userwholike, [$userId]);
            $this->setUserWhoLiked($userwholike);
            $this->setUserWhoDisliked($userwhodislike);
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
        return json_decode($this->useridtonotify, 1);
    }

    /**
     * @param mixed $task
     */
    public function setUserIdToNotify($task)
    {
        $this->useridtonotify = json_encode($task);
    }

    /**
     * @param mixed $nextreminder
     */
    public function setNextReminder($nextreminder)
    {
        $this->nextreminder = $nextreminder;
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
            "dependingtask" => $this->getDependingTask() != null ? $this->dependingtask->getId() : null,
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
            "workspace" => $this->getWorkspace() ? $this->getWorkspace()->getId() : null,
            "object_link_cache" => $this->getObjectLinkCache()
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
        return $this->dependingtask;
    }

    /**
     * @param mixed $dependingtask
     */
    public function setDependingTask($dependingtask)
    {
        $this->dependingtask = $dependingtask;
    }

    /**
     * @return ListOfTasks
     */
    public function getListOfTasks()
    {
        return $this->listoftasks;
    }

    /**
     * @param mixed $listoftasks
     */
    public function setListOfTasks($listoftasks)
    {
        $this->listoftasks = $listoftasks;
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
        return json_decode($this->userwholiked, 1);
    }

    /**
     * @param mixed $userwholiked
     */
    public function setUserWhoLiked($userwholiked)
    {
        $this->userwholiked = json_encode($userwholiked);
    }


    /**
     * @return mixed
     */
    public function getUserWhoDisliked()
    {
        return json_decode($this->userwhodisliked, 1);
    }

    /**
     * @param mixed $userwhodisliked
     */
    public function setUserWhoDisliked($userwhodisliked)
    {
        $this->userwhodisliked = json_encode($userwhodisliked);
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

    public function synchroniseField($fieldname, $value)
    {
        if (!property_exists($this, $fieldname))
            return false;

        $setter = "set" . ucfirst($fieldname);
        $this->$setter($value);
        return true;
    }

    public function get($fieldname)
    {
        if (!property_exists($this, $fieldname))
            return false;

        $getter = "get" . ucfirst($fieldname);

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

    public function setObjectLinkCache($cache)
    {
        $this->object_link_cache = json_encode($cache);
    }

    public function getObjectLinkCache()
    {
        return json_decode($this->object_link_cache, 1);
    }

}