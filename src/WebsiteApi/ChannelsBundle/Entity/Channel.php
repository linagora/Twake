<?php

namespace WebsiteApi\ChannelsBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\Date;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * Channel
 *
 * @ORM\Table(name="channel",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\ChannelsBundle\Repository\ChannelRepository")
 */
class Channel
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
 */
    private $id;

    /**
     * @ORM\Column(type="string", length=80)
     */
    private $front_id;

    /**
     * @ORM\Column(type="string", length=400, nullable=true)
     */
    private $identifier; //Max 10 users

    /**
     * @ORM\Column(name="icon", type="twake_text", nullable=true)
     */
    private $icon = "";

    /**
     * @ORM\Column(name="name", type="twake_text", nullable=true)
     */
    private $name = "";

    /**
     * @ORM\Column(name="channel_group_name", type="twake_text", nullable=true)
     */
    private $channel_group_name = "";

    /**
     * @ORM\Column(name="description", type="twake_text", nullable=true)
     */
    private $description = "";

    /**
     * @ORM\Column(name="external_access_token", type="twake_text", nullable=true)
     */
    private $external_access_token = null;

    /**
     * @ORM\Column(name="private", type="twake_boolean")
     */
    private $private = 0;

    /**
     * @ORM\Column(name="direct", type="twake_boolean")
     */
    private $direct = 0;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
     */
    private $original_workspace;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
     */
    private $original_group;

    /**
     * @ORM\Column(name="members_count", type="integer")
     */
    private $members_count = 0; //0 for public workspaces

    /**
     * @ORM\Column(name="members", type="twake_text")
     */
    private $members = "[]";

    /**
     * @ORM\Column(name="last_activity", type="twake_datetime" , options={"default" : "2018-07-27 14:00:58"})
     */
    private $last_activity;


    public function __construct()
    {
        $this->front_id = sha1(random_bytes(40));
        $this->last_activity = new \DateTime();
    }

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "front_id" => $this->getFrontId(),
            "icon" => $this->getIcon(),
            "name" => $this->getName(),
            "description" => $this->getDescription(),
            "channel_group_name" => $this->getChannelGroupName(),
            "private" => $this->getPrivate(),
            "direct" => $this->getDirect(),
            "original_workspace" => ($this->getOriginalWorkspace()) ? $this->getOriginalWorkspace()->getId() : null,
            "original_group" => ($this->getOriginalGroup()) ? $this->getOriginalGroup()->getId() : null,
            "members_count" => $this->getMembersCount(),
            "last_activity" => $this->getLastActivity() ? $this->getLastActivity()->getTimestamp() : null,
            "members" => $this->getMembers()
        );
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
    public function getFrontId()
    {
        return $this->front_id;
    }

    /**
     * @param mixed $front_id
     */
    public function setFrontId($front_id)
    {
        if ($front_id) {
            $this->front_id = $front_id;
        }
    }

    /**
     * @return mixed
     */
    public function getIcon()
    {
        return $this->icon;
    }

    /**
     * @param mixed $icon
     */
    public function setIcon($icon)
    {
        $this->icon = $icon;
    }

    /**
     * @return mixed
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param mixed $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @return mixed
     */
    public function getChannelGroupName()
    {
        return $this->channel_group_name;
    }

    /**
     * @param mixed $channel_group_name
     */
    public function setChannelGroupName($channel_group_name)
    {
        $this->channel_group_name = $channel_group_name;
    }

    /**
     * @return mixed
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * @param mixed $description
     */
    public function setDescription($description)
    {
        $this->description = $description;
    }

    /**
     * @return mixed
     */
    public function getExternalAccessToken()
    {
        return $this->external_access_token;
    }

    /**
     * @param mixed $external_access_token
     */
    public function setExternalAccessToken($external_access_token)
    {
        $this->external_access_token = $external_access_token;
    }

    /**
     * @return mixed
     */
    public function getPrivate()
    {
        return $this->private;
    }

    /**
     * @param mixed $private
     */
    public function setPrivate($private)
    {
        $this->private = ($private == true);
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
        $this->direct = ($direct == true);
    }

    /**
     * @return mixed
     */
    public function getOriginalWorkspace()
    {
        return $this->original_workspace;
    }

    /**
     * @param mixed $original_workspace
     */
    public function setOriginalWorkspace($original_workspace)
    {
        $this->original_workspace = $original_workspace;
    }

    /**
     * @return mixed
     */
    public function getOriginalGroup()
    {
        return $this->original_group;
    }

    /**
     * @param mixed $original_group
     */
    public function setOriginalGroup($original_group)
    {
        $this->original_group = $original_group;
    }

    /**
     * @return mixed
     */
    public function getMembersCount()
    {
        return $this->members_count;
    }

    /**
     * @param mixed $members_count
     */
    public function setMembersCount($members_count)
    {
        $this->members_count = $members_count;
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
    public function getIdentifier()
    {
        return $this->identifier;
    }

    /**
     * @param mixed $identifier
     */
    public function setIdentifier($identifier)
    {
        $this->identifier = $identifier;
    }

    /**
     * @return mixed
     */
    public function getMembers()
    {
        return json_decode($this->members, 1);
    }

    /**
     * @param mixed $members
     */
    public function setMembers($members)
    {
        $this->members = json_encode($members);
    }



}
