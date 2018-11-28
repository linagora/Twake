<?php

namespace WebsiteApi\CalendarBundle\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;

/**
 * Event
 *
 * @ORM\Table(name="calendar",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CalendarBundle\Repository\CalendarRepository")
 */

class Calendar {

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
     * @ORM\Column(type="string", nullable=true)
     */
    private $icsLink;

    /**
     * @ORM\Column(type="datetime" , options={"default" : "2018-07-27 14:00:58"})
     */
    private $lastUpdateDate;


    public  function __construct($title,$color, $icsLink=null)
    {
        $this->setTitle($title);
        $this->setColor($color);
        $this->setAutoParticipantList(Array());
        $this->setIcsLink($icsLink);
        $this->setLastUpdateDate(new DateTime('now'));
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

    /**
     * @return mixed
     */
    public function getIcsLink()
    {
        return $this->icsLink;
    }

    /**
     * @param mixed $icsLink
     */
    public function setIcsLink($icsLink)
    {
        $this->icsLink = $icsLink;
    }

    /**
     * @return mixed
     */
    public function getLastUpdateDate()
    {
        return $this->lastUpdateDate;
    }

    /**
     * @param mixed $lastUpdateDate
     */
    public function setLastUpdateDate($lastUpdateDate)
    {
        $this->lastUpdateDate = $lastUpdateDate;
    }

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "name" => $this->getTitle(),
            "color" => $this->getColor(),
            "workspaces_number" => $this->getWorkspacesNumber(),
            "autoParticipate" => $this->getAutoParticipantList(),
            "icsLink" => $this->getIcsLink()
        );
    }


}