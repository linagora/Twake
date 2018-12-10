<?php

namespace WebsiteApi\ProjectBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;

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
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
     */
    private $id;

    /**
     * @ORM\Column(name="title", type="text", nullable=true)
     * @Encrypted
     */
    private $title;

    /**
     * @ORM\Column(name="workspaces_number", type="integer", nullable=true)
     */
    private $workspacesnumber = 1;

    /**
     * @ORM\Column(name="auto_participate_list", type="text", nullable=false)
     * @Encrypted
     */
    private $autoparticipantlist;

    /**
     * @ORM\Column(type="text")
     * @Encrypted
     */
    private $description;

    /**
     * @ORM\Column(name="participant", type="text")
     * @Encrypted
     */
    private $participants;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $isprivate;

    public function __construct($title, $description, $isprivate)
    {
        $this->setTitle($title);
        $this->setIsPrivate($isprivate);
        $this->setAutoParticipantList(Array());
        $this->setParticipants(Array());
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

    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "name" => $this->getTitle(),
            "description" => $this->getDescription(),
            "isPrivate" => $this->getisPrivate(),
            "workspaces_number" => $this->getWorkspacesNumber(),
            "autoParticipate" => $this->getAutoParticipantList(),
            "participants" => $this->getParticipants()
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
        return $this->isprivate;
    }

    /**
     * @param mixed $isprivate
     */
    public function setIsPrivate($isprivate)
    {
        $this->isprivate = $isprivate;
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