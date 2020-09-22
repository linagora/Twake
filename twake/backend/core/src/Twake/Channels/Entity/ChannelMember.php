<?php

namespace Twake\Channels\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * ChannelMember
 *
 * @ORM\Table(name="channel_member",options={"engine":"MyISAM", "scylladb_keys": {
 *     {"direct":"ASC", "user_id":"ASC", "channel_id":"ASC", "id":"ASC"},
 *     {"channel_id":"ASC"},
 *     {"user_id":"ASC"},
 *     {"id":"ASC"},
 *     {"direct": "1", "user_id":"ASC", "last_activity_least_updated": "DESC", "channel_id":"ASC", "id":"ASC", "__name": "last_modified_channels"}
 *     } })
 * @ORM\Entity()
 */
class ChannelMember
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="user_id", type="text")
     * @ORM\Id
     */
    private $user_id = "";

    /**
     * @ORM\Column(name="channel_id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $channel_id;

    /**
     * @ORM\Column(name="direct", type="twake_boolean")
     * @ORM\Id
     */
    private $direct = 0;

    /**
     * @ORM\Column(name="externe", type="twake_boolean")
     */
    private $externe = 0;

    /**
     * @ORM\Column(name="last_activity_least_updated", type="twake_datetime" , options={"default" : "2018-07-27 14:00:58"})
     */
    private $last_activity_least_updated = 0;

    /**
     * @ORM\Column(name="last_activity", type="twake_datetime" , options={"default" : "2018-07-27 14:00:58"})
     */
    private $last_activity = 0;

    /**
     * @ORM\Column(name="last_access", type="twake_datetime" , options={"default" : "2018-07-27 14:00:58"})
     */
    private $last_access = 0;

    /**
     * @ORM\Column(name="muted", type="tinyint")
     */
    private $muted = 0;

    /**
     * @ORM\Column(name="last_messages_increment", type="integer")
     */
    private $last_messages_increment = 0; //Will increment on each new message to count notifications

    /**
     * @ORM\Column(name="last_quoted_message_id", type="text")
     */
    private $last_quoted_message_id = ""; //Will be set when the user is quoted to the quoted message id

    /**
     * ChannelMember constructor.
     * @param $user
     * @param $channel
     */
    public function __construct($user_id, $channel)
    {
        $this->user_id = $user_id;
        $this->channel_id = $channel->getId();
        $this->last_activity_least_updated = new \DateTime();
        $this->last_activity = new \DateTime();
        $this->last_access = new \DateTime();
        $this->direct = $channel->getDirect();
        $this->last_messages_increment = $channel->getMessagesIncrement();
    }

    /**
     * @return mixed
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
    public function getUserId()
    {
        return $this->user_id;
    }

    /**
     * @return mixed
     */
    public function getChannelId()
    {
        return $this->channel_id;
    }

    /**
     * @return mixed
     */
    public function getLastActivity()
    {
        return $this->last_activity;
    }

    /**
     * @param mixed $last_activity
     */
    public function setLastActivity($last_activity)
    {
        $this->last_activity = $last_activity;
        if ($this->last_activity_least_updated->getTimestamp() < $last_activity->getTimestamp() - 60 * 60 * 24) {
            $this->last_activity_least_updated = $last_activity;
        }
    }

    /**
     * @return mixed
     */
    public function getLastAccess()
    {
        return $this->last_access;
    }

    /**
     * @param mixed $last_access
     */
    public function setLastAccess($last_access)
    {
        $this->last_access = $last_access;
    }

    /**
     * @return mixed
     */
    public function getDirect()
    {
        return $this->direct;
    }

    /**
     * @param mixed $direct
     */
    public function setDirect($direct)
    {
        $this->direct = $direct;
    }

    /**
     * @return mixed
     */
    public function getExterne()
    {
        return $this->externe;
    }

    /**
     * @param mixed $direct
     */
    public function setExterne($externe)
    {
        $this->externe = $externe;
    }

    /**
     * @return mixed
     */
    public function getMuted()
    {
        return $this->muted;
    }

    /**
     * @param mixed $muted 0: no, 1: mute default (except @all, @[user]), 2: mute all except user mension, 3: mute everything
     */
    public function setMuted($muted)
    {
        $this->muted = $muted;
    }

    /**
     * @return mixed
     */
    public function getLastMessagesIncrement()
    {
        return $this->last_messages_increment;
    }

    /**
     * @param mixed $last_messages_increment
     */
    public function setLastMessagesIncrement($last_messages_increment)
    {
        $this->last_messages_increment = $last_messages_increment;
    }

    /**
     * @return mixed
     */
    public function getLastQuotedMessageId()
    {
        return $this->last_quoted_message_id;
    }

    /**
     * @param mixed $last_quoted_message_id
     */
    public function setLastQuotedMessageId($last_quoted_message_id)
    {
        $this->last_quoted_message_id = $last_quoted_message_id;
    }

}
