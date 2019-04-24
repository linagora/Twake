<?php

namespace WebsiteApi\CalendarBundle\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use WebsiteApi\CoreBundle\Entity\FrontObject;

/**
 * Calendar
 *
 * @ORM\Table(name="calendar",options={"engine":"MyISAM", "scylladb_keys": {{"workspace_id":"ASC", "id":"ASC"}, {"id":"ASC"}} })
 * @ORM\Entity(repositoryClass="WebsiteApi\CalendarBundle\Repository\CalendarRepository")
 */
class Calendar extends FrontObject
{

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="workspace_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $workspace_id;

    /**
     * @ORM\Column(name="title", type="twake_text", nullable=true)
     * @Encrypted
     */
    private $title;

    /**
     * @ORM\Column(name="color", type="string", nullable=true)
     */
    private $color;

    /**
     * @ORM\Column(name="auto_participants", type="twake_text", nullable=false)
     */
    private $auto_participants = "[]";


    public function __construct($workspace_id, $title, $color)
    {
        $this->setWorkspaceId($workspace_id);
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
    public function getWorkspaceId()
    {
        return $this->workspace_id;
    }

    /**
     * @param mixed $workspace_id
     */
    public function setWorkspaceId($workspace_id)
    {
        $this->workspace_id = $workspace_id;
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

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "title" => $this->getTitle(),
            "color" => $this->getColor(),
            "workspace_id" => $this->getWorkspaceId(),
            "auto_participants" => $this->getAutoParticipants()
        );
    }


}