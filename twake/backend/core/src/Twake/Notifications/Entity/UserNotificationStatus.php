<?php

namespace Twake\Notifications\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * Mail
 *
 * @ORM\Table(name="user_notification_status",options={"engine":"MyISAM", "scylladb_keys":{ {"user_id":"ASC", "id":"DESC"} }})
 * @ORM\Entity()
 */
class UserNotificationStatus
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="user_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $user_id;

    /**
     * @ORM\Column(type="integer")
     */
    private $mail_status;

    /**
     * UserNotificationStatus constructor.
     * @param $user
     */
    public function __construct($user_id)
    {
        $this->user_id = $user_id;
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
    public function getMailStatus()
    {
        return $this->mail_status;
    }

    /**
     * @param mixed $mail_status
     */
    public function setMailStatus($mail_status)
    {
        $this->mail_status = $mail_status;
    }


}

