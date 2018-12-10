<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 13/07/18
 * Time: 16:47
 */

namespace WebsiteApi\ProjectBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;

/**
 * ListOfTasks
 *
 * @ORM\Table(name="list_of_tasks",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ProjectBundle\Repository\ListOfTasksRepository")
 */
class ListOfTasks
{
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
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ProjectBundle\Entity\Board")
     */
    private $board;

    /**
     * @ORM\Column(name="order_ts", type="integer")
     */
    private $order = 0;

    /**
     * @ORM\Column(type="text")
     * @Encrypted
     */
    private $title;

    /**
     * @ORM\Column(type="string", length=10)
     */
    private $color;

    /**
     * @ORM\Column(type="text")
     * @Encrypted
     */
    private $useridtonotify;


    public function __construct($board, $title, $color, $participants = Array())
    {
        $this->setTitle($title);
        $this->setColor($color);
        $this->setUserIdToNotify($participants);
        $this->setBoard($board);
    }

    public function getAsArray(){
        return Array(
            "id" => $this->id,
            "label" => $this->title,
            "color" => $this->color,
            "order" => $this->getOrder()
        );
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
    public function getUserIdToNotify()
    {
        return json_decode($this->useridtonotify, 1);
    }

    /**
     * @param mixed $participant
     */
    public function setUserIdToNotify($useridtonotify)
    {
        $this->useridtonotify = json_encode($useridtonotify);
    }

    /**
     * @return Board
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

    public function getId()
    {
        return $this->id;
    }

}