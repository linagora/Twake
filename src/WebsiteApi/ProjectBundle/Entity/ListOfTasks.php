<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 13/07/18
 * Time: 16:47
 */

namespace WebsiteApi\ProjectBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

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
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ProjectBundle\Entity\Board")
     */
    private $board;

    /**
     * @ORM\Column(name="order_ts",type="integer")
     */
    private $order;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $title
    ;

    /**
     * @ORM\Column(type="string", length=10)
     */
    private $color;

    /**
     * @ORM\Column(type="boolean")
     */
    private $isDoneList;

    /**
     * @ORM\Column(type="text")
     */
    private $userIdToNotify;

    public function getAsArray(){
        return Array(
            "id" => $this->id,
            "label" => $this->title,
            "color" => $this->color,
            "order" => $this->getOrder(),
            "done" => $this->getisDoneList()
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
        return json_decode($this->userIdToNotify,1);
    }

    /**
     * @param mixed $participant
     */
    public function setUserIdToNotify($userIdToNotify)
    {
        $this->userIdToNotify = json_encode($userIdToNotify);
    }

    /**
     * @return mixed
     */
    public function getisDoneList()
    {
        return $this->isDoneList;
    }

    /**
     * @param mixed $isDoneList
     */
    public function setIsDoneList($isDoneList)
    {
        $this->isDoneList = $isDoneList;
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


    public  function __construct($board, $title,$color, $isDoneList, $participants = Array())
    {
        $this->setTitle($title);
        $this->setColor($color);
        $this->setIsDoneList($isDoneList);
        $this->setUserIdToNotify($participants);
        $this->setBoard($board);
        if(!$isDoneList)
            $this->setOrder(0);
        else
            $this->setOrder(10000);
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