<?php

namespace WebsiteApi\ProjectBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Task
 *
 * @ORM\Table(name="board",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ProjectBundle\Repository\BoardRepository")
 */

class Board {

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column(name="title", type="string", nullable=true)
     */
    private $title;

    /**
     * @ORM\Column(name="color", type="string", nullable=true)
     */
    private $color;

    /**
     * @ORM\Column(name="workspaces_number", type="integer", nullable=true)
     */
    private $workspacesNumber = 1;

    /**
     * @ORM\Column(name="autoParticipateList", type="string", length=264, nullable=false)
     */
    private $autoParticipantList;

    /**
     * @ORM\Column(type="text")
     */
    private $description;

    /**
     * @ORM\Column(name="participant", type="text")
     */
    private $participants;

    /**
     * @ORM\Column(type="boolean")
     */
    private $isPrivate;

    public  function __construct($title,$color,$description, $isPrivate)
    {
        $this->setTitle($title);
        $this->setColor($color);
        $this->setAutoParticipantList(Array());
        $this->setDescription($description);
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @return mixed
     */
    public function getAutoParticipantList()
    {
        if($this->autoParticipantList == null){
            return null;
        }else{
            return json_decode($this->autoParticipantList, true );
        }
    }

    /**
     * @param mixed $autoParticipantList
     */
    public function setAutoParticipantList($autoParticipantList)
    {
        $this->autoParticipantList = json_encode($autoParticipantList);
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
    public function getWorkspacesNumber()
    {
        return $this->workspacesNumber;
    }

    /**
     * @param mixed $workspacesNumber
     */
    public function setWorkspacesNumber($workspacesNumber)
    {
        $this->workspacesNumber = $workspacesNumber;
    }

    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "name" => $this->getTitle(),
            "color" => $this->getColor(),
            "description" => $this->getDescription(),
            "workspaces_number" => $this->getWorkspacesNumber(),
            "autoParticipate" => $this->getAutoParticipantList()
        );
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
    public function getisPrivate()
    {
        return $this->isPrivate;
    }

    /**
     * @param mixed $isPrivate
     */
    public function setIsPrivate($isPrivate)
    {
        $this->isPrivate = $isPrivate;
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


}