<?php

namespace WebsiteApi\ProjectBundle\Entity;


use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;

/**
 * Created by PhpStorm.
 * User: laura
 * Date: 25/06/18
 * Time: 09:23
 */


/**
 * Class BoardActivity
 * @package WebsiteApi\ProjectBundle\Entity
 *
 * @ORM\Table(name="board_activity", options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ProjectBundle\Repository\BoardActivityRepository")
 */
class BoardActivity
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application")
     */
    private $application;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
     */
    private $workspace;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     */
    private $user;

    /**
     * @ORM\Column(type="text", length=64, nullable=true)
     */
    private $title;

    /**
     * @ORM\Column(type="text", length=512, nullable=true)
     */
    private $text;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date;

    /**
     * @ORM\Column(type="text", length=1024, nullable=true)
     */
    private $data;

    /**
     * @ORM\Column(name="is_read", type="twake_boolean")
     */
    private $read = false;


    public function __construct($application, $workspace, $user)
    {
        $this->date = new \DateTime();
        $this->workspace = $workspace;
        $this->user = $user;
        $this->application = $application;
        $this->read = false;
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
    public function getText()
    {
        return $this->text;
    }

    /**
     * @param mixed $text
     */
    public function setText($text)
    {
        $this->text = $text;
    }

    /**
     * @return mixed
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * @param mixed $date
     */
    public function setDate($date)
    {
        $this->date = $date;
    }

    /**
     * @return mixed
     */
    public function getData()
    {
        if (!$this->data) {
            return null;
        }
        return json_decode($this->data, 1);
    }

    /**
     * @param mixed $data
     */
    public function setData($data)
    {
        $this->data = json_encode($data);
    }

    /**
     * @return mixed
     */
    public function getApplication()
    {
        return $this->application;
    }

    /**
     * @param mixed $application
     */
    public function setApplication($application)
    {
        $this->application = $application;
    }

    /**
     * @return mixed
     */
    public function getRead()
    {
        return $this->read;
    }

    /**
     * @param mixed $read
     */
    public function setRead($read)
    {
        $this->read = $read;
    }


    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "date" => $this->getDate()->getTimestamp(),
            "workspace_id" => ($this->getWorkspace() ? $this->getWorkspace()->getID() : null),
            "app_id" => ($this->getApplication() ? $this->getApplication()->getId() : null),
            "title" => $this->getTitle(),
            "text" => $this->getText(),
            "data" => $this->getData(),
            "read" => $this->getRead()
        );
    }

}