<?php

namespace WebsiteApi\ProjectBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;

/**
 * linkTaskUser
 *
 * @ORM\Table(name="link_task_user",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ProjectBundle\Repository\LinkTaskUserRepository")
 */

class LinkTaskUser{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="cassandra_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
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


    public function getAsArray(){
        return Array(
            "id" => $this->getId(),
            "user" => $this->getUser(),
            "task" => $this->getTask()
        );
    }


}