<?php

namespace Twake\Tasks\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;


/**
 * TaskUser
 *
 * @ORM\Table(name="task_user",options={"engine":"MyISAM", "scylladb_keys": {{"user_id_or_mail": "ASC", "id": "ASC"}, {"task_id":"ASC"}} })
 * @ORM\Entity()
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
     * @ORM\Column(name="task_id", type="twake_timeuuid")
     */
    private $task_id;

    /**
     * @ORM\Column(name="email", type="twake_no_salt_text")
     */
    private $email = "";


    public function __construct($user_id_or_mail, $task_id)
    {
        $this->user_id_or_mail = $user_id_or_mail;
        $this->task_id = $task_id;
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
    public function getTaskId()
    {
        return $this->task_id;
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