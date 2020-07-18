<?php

namespace Twake\Tasks\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;

use Twake\Core\Entity\FrontObject;

/**
 * Board
 *
 * @ORM\Table(name="tasks_list",options={"engine":"MyISAM", "scylladb_keys": {{"board_id":"ASC", "id":"ASC"}, {"id":"ASC"}} })
 * @ORM\Entity()
 */
class BoardList extends FrontObject
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
     * @ORM\Column(name="title", type="twake_text", nullable=true)
     */
    private $title;

    /**
     * @ORM\Column(name="color", type="string", nullable=true)
     */
    private $color;

    /**
     * @ORM\Column(name="emoji", type="string", nullable=true)
     */
    private $emoji;

    /**
     * @ORM\Column(name="order_pos", type="twake_text", nullable=true)
     */
    private $order;

    /**
     * @ORM\Column(name="auto_participants", type="twake_text", nullable=false)
     */
    private $auto_participants = "[]";


    public function __construct($board_id, $title, $color)
    {
        $this->setBoardId($board_id);
        $this->setTitle($title);
        $this->setColor($color);
        $this->setAutoParticipants(Array());
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
    public function getBoardId()
    {
        return $this->board_id;
    }

    /**
     * @param mixed $workspace_id
     */
    public function setBoardId($board_id)
    {
        $this->board_id = $board_id;
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
    public function getColor()
    {
        return $this->color;
    }

    /**
     * @param mixed $color
     */
    public function setColor($color)
    {
        $this->color = $color;
    }

    /**
     * @return mixed
     */
    public function getAutoParticipants()
    {
        return json_decode($this->auto_participants, 1);
    }

    /**
     * @param mixed $auto_participants
     */
    public function setAutoParticipants($auto_participants)
    {
        $this->auto_participants = json_encode($auto_participants);
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

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "front_id" => $this->getFrontId(),
            "title" => $this->getTitle(),
            "color" => $this->getColor(),
            "emoji" => $this->getEmoji(),
            "order" => $this->getOrder(),
            "board_id" => $this->getBoardId(),
            "auto_participants" => $this->getAutoParticipants()
        );
    }


}