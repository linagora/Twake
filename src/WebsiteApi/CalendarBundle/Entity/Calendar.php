<?php

namespace WebsiteApi\CalendarBundle\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;

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
     * @ORM\Column(name="id", type="cassandra_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
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
    private $workspacesnumber = 1;

    /**
     * @ORM\Column(name="auto_participate_list", type="string", length=264, nullable=false)
     */
    private $autoparticipantlist;


    /**
     * @ORM\Column(type="string", nullable=true)
     */
    private $icslink;

    /**
     * @ORM\Column(type="cassandra_datetime" , options={"default" : "2018-07-27 14:00:58"})
     */
    private $lastupdatedate;


    public  function __construct($title,$color, $icsLink=null)
    {
        $this->setTitle($title);
        $this->setColor($color);
        $this->setAutoParticipantList(Array());
        $this->setIcsLink($icslink);
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
        if ($this->autoparticipantlist == null) {
            return null;
        }else{
            return json_decode($this->autoparticipantlist, true);
        }
    }

    /**
     * @param mixed $autoparticipantlist
     */
    public function setAutoParticipantList($autoparticipantlist)
    {
        $this->autoparticipantlist = json_encode($autoparticipantlist);
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
        return $this->workspacesnumber;
    }

    /**
     * @param mixed $workspacesnumber
     */
    public function setWorkspacesNumber($workspacesnumber)
    {
        $this->workspacesnumber = $workspacesnumber;
    }

    /**
     * @return mixed
     */
    public function getIcsLink()
    {
        return $this->icslink;
    }

    /**
     * @param mixed $icslink
     */
    public function setIcsLink($icslink)
    {
        $this->icslink = $icslink;
    }

    /**
     * @return mixed
     */
    public function getLastUpdateDate()
    {
        return $this->lastupdatedate;
    }

    /**
     * @param mixed $lastupdatedate
     */
    public function setLastUpdateDate($lastupdatedate)
    {
        $this->lastupdatedate = $lastupdatedate;
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