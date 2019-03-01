<?php

namespace WebsiteApi\DiscussionBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\CoreBundle\Entity\FrontObject;

/**
 * Message
 *
 * @ORM\Table(name="message",options={"engine":"MyISAM", "scylladb_keys": {{"channel_id":"ASC", "parent_message_id":"ASC", "id":"DESC"}} })
 * @ORM\Entity(repositoryClass="WebsiteApi\DiscussionBundle\Repository\MessageRepository")
 */
class Message extends FrontObject
{

    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="channel_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $channel_id;

    /**
     * @ORM\Column(name="parent_message_id", type="twake_text")
     * @ORM\Id
     */
    private $parent_message_id = "";

    /**
     * @ORM\Column(name="responses_count", type="integer")
     */
    private $responses_count = 0;

    /**
     * @ORM\Column(name="message_type", type="integer")
     */
    private $message_type = 0; //0 from user, 1 from application, 2 from system

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
     */
    private $sender = null;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\MarketBundle\Entity\Application",cascade={"persist"})
     * @ORM\JoinColumn(nullable=true)
     */
    private $application = null;


    /**
     * @ORM\Column(name="creation_date", type="twake_datetime", nullable=true)
     */
    private $creation_date;

    /**
     * @ORM\Column(name="modification_date", type="twake_datetime", nullable=true)
     */
    private $modification_date;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $edited = false;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $pinned = false;

    /**
     * @ORM\Column(name="hidden_data", type="twake_text")
     */
    private $hidden_data = "{}";

    /**
     * @ORM\Column(name="reactions", type="twake_text")
     */
    private $reactions = "{}";

    /**
     * @ORM\Column(name="content", type="twake_text")
     */
    private $content = "[]";

    /**
     * Message constructor.
     */
    public function __construct($channel_id, $parent_message_id)
    {
        $this->channel_id = $channel_id;
        $this->parent_message_id = $parent_message_id;
        $this->creation_date = new \DateTime();
        $this->modification_date = new \DateTime();
    }

    /**
     * Get the value of Id
     *
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set the value of Id
     *
     * @param mixed id
     *
     * @return self
     */
    public function setId($id)
    {
        $this->id = $id;

        return $this;
    }

    /**
     * Get the value of Channel Id
     *
     * @return mixed
     */
    public function getChannelId()
    {
        return $this->channel_id;
    }

    /**
     * Get the value of Parent Message Id
     *
     * @return mixed
     */
    public function getParentMessageId()
    {
        return $this->parent_message_id;
    }

    public function setParentMessageId($id)
    {
        $this->parent_message_id = $id;
    }

    /**
     * Get the value of Responses Count
     *
     * @return mixed
     */
    public function getResponsesCount()
    {
        return $this->responses_count;
    }

    /**
     * Set the value of Responses Count
     *
     * @param mixed responses_count
     *
     * @return self
     */
    public function setResponsesCount($responses_count)
    {
        $this->responses_count = max(0, $responses_count);

        return $this;
    }

    /**
     * Get the value of Message Type
     *
     * @return mixed
     */
    public function getMessageType()
    {
        return $this->message_type;
    }

    /**
     * Set the value of Message Type
     *
     * @param mixed message_type
     *
     * @return self
     */
    public function setMessageType($message_type)
    {
        $this->message_type = $message_type;

        return $this;
    }

    /**
     * Get the value of Sender
     *
     * @return mixed
     */
    public function getSender()
    {
        return $this->sender;
    }

    /**
     * Set the value of Sender
     *
     * @param mixed sender
     *
     * @return self
     */
    public function setSender($sender)
    {
        $this->sender = $sender;

        return $this;
    }

    /**
     * Get the value of Application
     *
     * @return mixed
     */
    public function getApplication()
    {
        return $this->application;
    }

    /**
     * Set the value of Application
     *
     * @param mixed application
     *
     * @return self
     */
    public function setApplication($application)
    {
        $this->application = $application;

        return $this;
    }

    /**
     * Get the value of Creation Date
     *
     * @return mixed
     */
    public function getCreationDate()
    {
        return $this->creation_date;
    }

    /**
     * Set the value of Creation Date
     *
     * @param mixed creation_date
     *
     * @return self
     */
    public function setCreationDate($creation_date)
    {
        $this->creation_date = $creation_date;

        return $this;
    }

    /**
     * Get the value of Modification Date
     *
     * @return mixed
     */
    public function getModificationDate()
    {
        return $this->modification_date;
    }

    /**
     * Set the value of Modification Date
     *
     * @param mixed modification_date
     *
     * @return self
     */
    public function setModificationDate($modification_date)
    {
        $this->modification_date = $modification_date;

        return $this;
    }

    /**
     * Get the value of Edited
     *
     * @return mixed
     */
    public function getEdited()
    {
        return $this->edited;
    }

    /**
     * Set the value of Edited
     *
     * @param mixed edited
     *
     * @return self
     */
    public function setEdited($edited)
    {
        $this->edited = $edited;

        return $this;
    }

    /**
     * Get the value of Pinned
     *
     * @return mixed
     */
    public function getPinned()
    {
        return $this->pinned;
    }

    /**
     * Set the value of Pinned
     *
     * @param mixed pinned
     *
     * @return self
     */
    public function setPinned($pinned)
    {
        $this->pinned = $pinned;

        return $this;
    }

    /**
     * Get the value of Hidden Data
     *
     * @return mixed
     */
    public function getHiddenData()
    {
        if (!$this->hidden_data) {
            return Array();
        }
        return json_decode($this->hidden_data, 1);
    }

    /**
     * Set the value of Hidden Data
     *
     * @param mixed hidden_data
     *
     * @return self
     */
    public function setHiddenData($hidden_data)
    {
        $this->hidden_data = json_encode($hidden_data);

        return $this;
    }

    /**
     * Get the value of Hidden Data
     *
     * @return mixed
     */
    public function getReactions()
    {
        if (!$this->reactions) {
            return Array();
        }
        return json_decode($this->reactions, 1);
    }

    /**
     * Set the value of Hidden Data
     *
     * @param mixed hidden_data
     *
     * @return self
     */
    public function setReactions($reactions)
    {
        $this->reactions = json_encode($reactions);

        return $this;
    }

    /**
     * Get the value of Content
     *
     * @return mixed
     */
    public function getContent()
    {
        return $this->content;
    }

    /**
     * Set the value of Content
     *
     * @param mixed content
     *
     * @return self
     */
    public function setContent($content)
    {
        $this->content = $content;

        return $this;
    }

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "front_id" => $this->getFrontId(),
            "channel_id" => $this->getChannelId(),
            "parent_message_id" => $this->getParentMessageId(),
            "responses_count" => $this->getResponsesCount(),
            "message_type" => $this->getMessageType(),
            "sender" => ($this->getSender() ? $this->getSender()->getId() : null),
            "application" => ($this->getApplication() ? $this->getApplication()->getId() : null),
            "edited" => $this->getEdited(),
            "pinned" => $this->getPinned(),
            "hidden_data" => $this->getHiddenData(),
            "reactions" => $this->getReactions(),
            "modification_date" => ($this->getModificationDate() ? $this->getModificationDate()->getTimestamp() : null),
            "creation_date" => ($this->getCreationDate() ? $this->getCreationDate()->getTimestamp() : null),
            "content" => $this->getContent()
        );
    }

}
