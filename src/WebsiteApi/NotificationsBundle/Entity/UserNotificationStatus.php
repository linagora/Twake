<?php

namespace WebsiteApi\NotificationsBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * Mail
 *
 * @ORM\Table(name="user_notification_status",options={"engine":"MyISAM", "scylladb_keys":{ {"user_id":"ASC", "id":"DESC"} }})
 * @ORM\Entity(repositoryClass="WebsiteApi\NotificationsBundle\Repository\UserNotificationStatusRepository")
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
     * @ORM\ManyToOne(name="user_id", type="twake_timeuuid")
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

