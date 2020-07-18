<?php

namespace Twake\Notifications\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * Mail
 *
 * @ORM\Table(name="mail_push_queue",options={"engine":"MyISAM", "scylladb_keys":{{"id":"ASC"}, {"user_id":"ASC"} }})
 * @ORM\Entity()
 */
class MailNotificationQueue
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(type="twake_no_salt_text")
     */
    private $user_id;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date;

    /**
     * @ORM\Column(type="twake_text")
     */
    private $atoken;


    public function __construct($user_id)
    {
        $this->date = new \DateTime();
        $this->user_id = $user_id;
    }

    /**
     * @return int
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    public function getId()
    {
        return $this->id;
    }

    /**
     * @return \DateTime
     */
    public function setDate($date)
    {
        $this->date = $date;
    }

    /**
     * @return \DateTime
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * @return \DateTime
     */
    public function getUserId()
    {
        return $this->user_id;
    }

    /**
     * @return mixed
     */
    public function getToken()
    {
        return $this->atoken;
    }

    /**
     * @param mixed $token
     */
    public function setToken($token): void
    {
        $this->atoken = $token;
    }


}
