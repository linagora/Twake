<?php

namespace Twake\Calendar\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;


/**
 * EventUser
 *
 * @ORM\Table(name="event_user",options={"engine":"MyISAM", "scylladb_keys": {{"user_id_or_mail": "ASC", "sort_date": "ASC", "id": "ASC"}, {"event_id":"ASC"}} })
 * @ORM\Entity()
 */
class EventUser
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
     * @ORM\Column(name="event_id", type="twake_timeuuid")
     */
    private $event_id;

    /**
     * @ORM\Column(name="email", type="twake_no_salt_text")
     */
    private $email = "";

    /**
     * @ORM\Column(name="accept_status", type="twake_no_salt_text")
     */
    private $accept_status = "pending";


    public function __construct($user_id_or_mail, $event_id, $sort_date, $accept_status = "pending")
    {
        $this->user_id_or_mail = $user_id_or_mail;
        $this->event_id = $event_id;
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
    public function getEventId()
    {
        return $this->event_id;
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