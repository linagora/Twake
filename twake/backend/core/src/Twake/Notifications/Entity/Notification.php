<?php

namespace Twake\Notifications\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * Mail
 *
 * @ORM\Table(name="notification",options={"engine":"MyISAM", "scylladb_keys":{ {"user_id":"ASC", "id":"DESC"}, {"id":"DESC"} }})
 * @ORM\Entity()
 */
class Notification
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
     * @ORM\Id
     */
    private $application_id;

    /**
     * @ORM\Column(type="twake_no_salt_text")
     */
    private $channel_id;

    /**
     * @ORM\Column(type="twake_no_salt_text")
     * @ORM\Id
     */
    private $workspace_id;

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Users\Entity\User")
     * @ORM\Id
     */
    private $user;

    /**
     * @ORM\Column(type="twake_no_salt_text", nullable=true)
     */
    private $code;

    /**
     * @ORM\Column(type="twake_no_salt_text", nullable=true)
     */
    private $shortcut;

    /**
     * @ORM\Column(type="twake_text",  nullable=true)
     */
    private $title;

    /**
     * @ORM\Column(type="twake_text",  nullable=true)
     */
    private $text;

    /**
     * @ORM\Column(type="twake_text")
     */
    private $data = "{}";

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date;

    /**
     * @ORM\Column(type="integer", nullable=false)
     */
    private $mail_sent = 0;

    /**
     * @ORM\Column(type="twake_datetime", nullable=true)
     */
    private $last_mail = null;

    /**
     * @ORM\Column(type="twake_boolean" , options={"default" : true})
     */
    private $isread;

    public function __construct($application_id, $workspace_id, $channel_id, $user)
    {
        $this->date = new \DateTime();
        $this->application_id = $application_id;
        $this->workspace_id = $workspace_id;
        $this->channel_id = $channel_id;
        $this->user = $user;
        $this->setIsRead(false);
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
     * @return mixed
     */
    public function getApplicationId()
    {
        return $this->application_id;
    }

    /**
     * @return mixed
     */
    public function getWorkspaceId()
    {
        return $this->workspace_id;
    }

    /**
     * @return \DateTime
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * @return mixed
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * @return mixed
     */
    public function getCode()
    {
        return $this->code;
    }

    /**
     * @param mixed $code
     */
    public function setCode($code)
    {
        $this->code = $code;
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
    public function getMailSent()
    {
        return $this->mail_sent;
    }

    /**
     * @param mixed $mail_sent
     */
    public function setMailSent($mail_sent)
    {
        $this->mail_sent = $mail_sent;
    }

    /**
     * @return mixed
     */
    public function getLastMail()
    {
        return $this->last_mail;
    }

    /**
     * @param mixed $last_mail
     */
    public function setLastMail($last_mail)
    {
        $this->last_mail = $last_mail;
    }

    /**
     * @return mixed
     */
    public function getChannelId()
    {
        return $this->channel_id;
    }


    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "date" => $this->getDate()->getTimestamp(),
            "code" => $this->getCode(),
            "workspace_id" => ($this->getWorkspaceId() ? $this->getWorkspaceId() : null),
            "application_id" => ($this->getApplicationId() ? $this->getApplication() : null),
            "channel_id" => ($this->getChannelId() ? $this->getChannelId() : null),
            "title" => $this->getTitle(),
            "text" => $this->getText(),
            "is_read" => $this->getisRead(),
            "data" => $this->getData()
        );
    }

    /**
     * @return mixed
     */
    public function getisRead()
    {
        return $this->isread;
    }

    /**
     * @param mixed $isread
     */
    public function setIsRead($isread)
    {
        $this->isread = $isread;
    }

    /**
     * @return mixed
     */
    public function getShortcut()
    {
        return $this->shortcut;
    }

    /**
     * @param mixed $shortcut
     */
    public function setShortcut($shortcut)
    {
        $this->shortcut = $shortcut;
    }


}

