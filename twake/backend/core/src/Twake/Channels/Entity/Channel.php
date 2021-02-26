<?php

namespace Twake\Channels\Entity;

use Doctrine\ORM\Mapping as ORM;


use Twake\Core\Services\DoctrineAdapter\FakeCassandraTimeuuid;
use Twake\Core\Entity\SearchableObject;

/**
 * Channel
 *
 * @ORM\Table(name="channel",options={"engine":"MyISAM", "scylladb_keys": {{"direct":"ASC", "original_workspace_id":"ASC", "id":"ASC"}, {"id":"ASC"}, {"identifier":"ASC"}, {"app_bot_identifier": "ASC"}} })
 * @ORM\Entity()
 */
class Channel extends SearchableObject
{

    protected $es_type = "channel";

    /**
     * @ORM\Column(name="id", type="twake_uuid")
     * @ORM\Id
     */
    private $id;

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
     * @ORM\Column(name="channel_group_name", type="twake_no_salt_text", nullable=true)
     */
    private $channel_group_name = "";

    /**
     * @ORM\Column(name="description", type="twake_text", nullable=true)
     */
    private $description = "";

    /**
     * @ORM\Column(name="external_access_token", type="twake_no_salt_text", nullable=true)
     */
    private $external_access_token = null;

    /**
     * @ORM\Column(name="private", type="twake_boolean")
     */
    private $private = 0;

    /**
     * @ORM\Column(name="direct", type="twake_boolean")
     * @ORM\Id
     */
    private $direct = 0;

    /**
     * @ORM\Column(name="auto_mute", type="twake_boolean")
     */
    private $auto_mute = 0;

    /**
     * @ORM\Column(name="application", type="twake_boolean")
     */
    private $application = 0;

    /**
     * @ORM\Column(name="app_id", type="twake_no_salt_text")
     */
    private $app_id = "";

    /**
     * @ORM\Column(name="app_group_id", type="twake_no_salt_text")
     */
    private $app_group_id = "";

    /**
     * @ORM\Column(name="app_bot_identifier", type="twake_no_salt_text")
     */
    private $app_bot_identifier = "";

    /**
     * @ORM\Column(name="original_workspace_id", type="twake_no_salt_text")
     * @ORM\Id
     */
    private $original_workspace_id = "";

    /**
     * @ORM\Column(name="original_group_id", type="twake_timeuuid")
     */
    private $original_group_id;

    /**
     * @ORM\Column(name="members_count", type="integer")
     */
    private $members_count = 0; //0 for public workspaces

    /**
     * @ORM\Column(name="messages_count", type="integer")
     */
    private $messages_count = 0; //0 for public workspaces

    /**
     * @ORM\Column(name="members", type="twake_text")
     */
    private $members = "[]";

    /**
     * @ORM\Column(name="ext_members", type="twake_text")
     */
    private $ext_members = "[]";

    /**
     * @ORM\Column(name="tabs", type="twake_text")
     */
    private $tabs = "[]";

    /**
     * @ORM\Column(name="last_activity", type="twake_datetime" , options={"default" : "2018-07-27 14:00:58"})
     */
    private $last_activity;

    /**
     * @ORM\Column(name="messages_increment", type="integer")
     */
    private $messages_increment = 0; //Will increment on each new message to count notifications

    /**
     * @ORM\Column(name="connectors", type="twake_text")
     */
    private $connectors = "[]";


    public function __construct()
    {
        $this->front_id = sha1(random_bytes(40));
        $this->last_activity = new \DateTime();
    }

    public function getIndexationArray()
    {
        $return = Array(
            "id" => $this->getId() . "",
            "workspace_id" => $this->getOriginalWorkspaceId(),
            "group_id" => ($this->getOriginalGroupId()) ? $this->getOriginalGroupId() : null,
            "name" => $this->getName(),
            "last_activity" => $this->getLastActivity() ? $this->getLastActivity()->getTimestamp() : null,
            "members" => $this->getMembers(),
            "ext_members" => $this->getExtMembers()
        );

        return $return;
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
            "application" => $this->getApplication(),
            "app_id" => $this->getAppId(),
            "app_group_id" => $this->getAppGroupId(),
            "app_bot_identifier" => $this->getAppBotIdentifier(),
            "original_workspace" => ($this->getOriginalWorkspaceId()) ? $this->getOriginalWorkspaceId() : null,
            "original_group" => ($this->getOriginalGroupId()) ? $this->getOriginalGroupId() : null,
            "members_count" => $this->getMembersCount(),
            "last_activity" => $this->getLastActivity() ? $this->getLastActivity()->getTimestamp() : null,
            "members" => $this->getMembers(),
            "ext_members" => $this->getExtMembers(),
            "connectors" => $this->getConnectors(),
            "tabs" => $this->getTabs(),
            "messages_increment" => $this->getMessagesIncrement()
        );
    }

    public function getTotalMembers()
    {
        return array_merge($this->getMembers(), $this->getExtMembers());
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
     * @return Boolean (application channel or not)
     */
    public function getApplication()
    {
        return $this->application;
    }

    /**
     * @return string
     */
    public function getEsType()
    {
        return $this->es_type;
    }


    /**
     * @param mixed $direct
     */
    public function setApplication($application)
    {
        $this->application = ($application == true);
    }

    /**
     * @return mixed
     */
    public function getAppId()
    {
        return $this->app_id;
    }

    /**
     * @return mixed
     */
    public function getAppBotIdentifier()
    {
        return $this->app_bot_identifier;
    }

    /**
     * @param mixed $app_bot_identifier
     */
    public function setAppBotIdentifier($app_bot_identifier)
    {
        $this->app_bot_identifier = $app_bot_identifier;
    }

    /**
     * @param mixed $direct
     */
    public function setAppId($app_id)
    {
        $this->app_id = $app_id;
    }

    /**
     * @return mixed
     */
    public function getAppGroupId()
    {
        return $this->app_group_id;
    }

    /**
     * @param mixed $app_group_id
     */
    public function setAppGroupId($app_group_id)
    {
        $this->app_group_id = $app_group_id;
    }

    /**
     * @return mixed
     */
    public function getOriginalWorkspaceId()
    {
        return $this->original_workspace_id;
    }

    /**
     * @param mixed $original_workspace
     */
    public function setOriginalWorkspaceId($original_workspace_id)
    {
        $this->original_workspace_id = $original_workspace_id;
    }

    /**
     * @return mixed
     */
    public function getOriginalGroupId()
    {
        return $this->original_group_id;
    }

    /**
     * @param mixed $original_group
     */
    public function setOriginalGroupId($original_group)
    {
        $this->original_group_id = $original_group;
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
        $m = json_decode($this->members, 1);
        if ($m) {
            return array_values($m);
        }
        return $m;
    }

    /**
     * @param mixed $members
     */
    public function setMembers($members)
    {
        $this->members = json_encode($members);
    }

    /**
     * @return mixed
     */
    public function getExtMembers()
    {
        $m = json_decode($this->ext_members, 1);
        if ($m) {
            return array_values($m);
        }
        return $m;
    }

    /**
     * @param mixed $ext_members
     */
    public function setExtMembers($ext_members)
    {
        $this->ext_members = json_encode($ext_members);
    }

    /**
     * @return mixed
     */
    public function getTabs()
    {
        $m = json_decode($this->tabs, 1);
        if ($m) {
            return array_values($m);
        }
        return $m;
    }

    /**
     * @param mixed $tabs
     */
    public function setTabs($tabs)
    {
        $this->tabs = json_encode($tabs);
    }

    /**
     * @return mixed
     */
    public function getConnectors()
    {
        $m = json_decode($this->connectors, 1);
        if ($m) {
            return array_values($m);
        }
        return $m;
    }

    /**
     * @param mixed $tabs
     */
    public function setConnectors($connectors)
    {
        $this->connectors = json_encode($connectors);
    }


    /**
     * @return mixed
     */
    public function getMessagesCount()
    {
        return $this->messages_count;
    }

    /**
     * @param mixed $messages_count
     */
    public function setMessagesCount($messages_count)
    {
        $this->messages_count = $messages_count;
    }

    /**
     * @return mixed
     */
    public function getMessagesIncrement()
    {
        return $this->messages_increment ? $this->messages_increment : 0;
    }

    /**
     * @param mixed $messages_increment
     */
    public function setMessagesIncrement($messages_increment)
    {
        $this->messages_increment = $messages_increment;
    }

    /**
     * @return mixed
     */
    public function getAutoMute()
    {
        return $this->auto_mute;
    }

    /**
     * @param mixed $auto_mute
     */
    public function setAutoMute($auto_mute)
    {
        $this->auto_mute = $auto_mute;
    }


}
