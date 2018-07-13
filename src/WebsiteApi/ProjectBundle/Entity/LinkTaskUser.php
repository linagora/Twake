<?php

namespace WebsiteApi\ProjectBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * linkTaskUser
 *
 * @ORM\Table(name="linkTaskUser",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ProjectBundle\Repository\LinkTaskUserRepository")
 */

class LinkTaskUser{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     * @ORM\JoinColumn(nullable=true)
     */

    private $user;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ProjectBundle\Entity\BoardTask")
     * @ORM\JoinColumn(nullable=true)
     */

    private $task;

    /**
     * @ORM\Column(name="from_ts", type="bigint")
     */
    private $from;

    /**
     * @ORM\Column(name="to_ts", type="bigint")
     */
    private $to;

    public  function __construct($user,$task)
    {
        $this->setUser($user);
        $this->setTask($task);
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
    public function getTask()
    {
        return $this->task;
    }

    /**
     * @param mixed $task
     */
    public function setTask($task)
    {
        $this->task = $task;
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
        $this->to = $to;
    }


    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "user" => $this->getUser(),
            "task" => $this->getTask()
        );
    }


}