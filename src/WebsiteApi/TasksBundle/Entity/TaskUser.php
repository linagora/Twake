<?php

namespace WebsiteApi\TasksBundle\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * TaskUser
 *
 * @ORM\Table(name="task_user",options={"engine":"MyISAM", "scylladb_keys": {{"user_id_or_mail": "ASC", "sort_date": "ASC", "id": "ASC"}, {"task_id":"ASC"}} })
 * @ORM\Entity(repositoryClass="WebsiteApi\TasksBundle\Repository\TaskUserRepository")
 */
class TaskUser
{

    /**
     * @ORM\Column(name="user_id_or_mail", type="twake_string")
     * @ORM\Id
     */
    private $user_id_or_mail;

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="sort_date", type="twake_bigint")
     * @ORM\Id
     */
    private $sort_date;

    /**
     * @ORM\Column(name="task_id", type="twake_timeuuid")
     */
    private $task_id;

    /**
     * @ORM\Column(name="email", type="twake_text")
     */
    private $email = "";

    /**
     * @ORM\Column(name="accept_status", type="twake_text")
     */
    private $accept_status = "pending";


    public function __construct($user_id_or_mail, $task_id, $sort_date, $accept_status = "pending")
    {
        $this->user_id_or_mail = $user_id_or_mail;
        $this->task_id = $task_id;
        $this->sort_date = $sort_date;
        $this->accept_status = $accept_status;
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
    public function getUserIdOrMail()
    {
        return $this->user_id_or_mail;
    }

    /**
     * @return mixed
     */
    public function getSortDate()
    {
        return $this->sort_date;
    }

    /**
     * @return mixed
     */
    public function getTaskId()
    {
        return $this->task_id;
    }

    /**
     * @return mixed
     */
    public function getAcceptStatus()
    {
        return $this->accept_status;
    }

    /**
     * @param mixed $accept_status
     */
    public function setAcceptStatus($accept_status)
    {
        $this->accept_status = $accept_status;
    }

    /**
     * @return mixed
     */
    public function getEmail()
    {
        return $this->email;
    }

    /**
     * @param mixed $email
     */
    public function setEmail($email)
    {
        $this->email = $email;
    }


}