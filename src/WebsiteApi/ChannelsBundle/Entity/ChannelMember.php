<?php

namespace WebsiteApi\ChannelsBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * ChannelMember
 *
 * @ORM\Table(name="channel_member",options={"engine":"MyISAM", "scylladb_keys": {{"direct", "user_id", "id"}, {"channel_id"}, {"user_id"}} })
 * @ORM\Entity(repositoryClass="WebsiteApi\ChannelsBundle\Repository\ChannelMemberRepository")
 */
class ChannelMember
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
 */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     */
    private $user;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\ChannelsBundle\Entity\Channel")
     */
    private $channel;

    /**
     * @ORM\Column(name="direct", type="twake_boolean")
     */
    private $direct = 0;

    /**
     * @ORM\Column(name="last_activity", type="twake_datetime" , options={"default" : "2018-07-27 14:00:58"})
     */
    private $last_activity = 0;

    /**
     * @ORM\Column(name="last_access", type="twake_datetime" , options={"default" : "2018-07-27 14:00:58"})
     */
    private $last_access = 0;

    /**
     * ChannelMember constructor.
     * @param $user
     * @param $channel
     */
    public function __construct($user, $channel)
    {
        $this->user = $user;
        $this->channel = $channel;
        $this->last_activity = new \DateTime();
        $this->last_access = new \DateTime();
        $this->direct = $channel->getDirect();
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
    public function getUser()
    {
        return $this->user;
    }

    /**
     * @return mixed
     */
    public function getChannel()
    {
        return $this->channel;
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



}
