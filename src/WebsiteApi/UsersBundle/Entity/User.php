<?php

namespace WebsiteApi\UsersBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use FOS\UserBundle\Model\User as BaseUser;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceParent;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;

/**
 * User
 *
 * @ORM\Table(name="user",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\UsersBundle\Repository\UserRepository")
 */
class User extends BaseUser
{
	/**
	 * @var int
	 *
     * @ORM\Column(name="id", type="cassandra_timeuuid")
	 * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
	 */
	protected $id;

	/**
	 * @ORM\Column(name="banned", type="boolean")
	 */
	protected $banned = false;

    /**
     * @ORM\Column(type="boolean", options={"default" : false } )
     */
    protected $isRobot;

	/**
	 * @ORM\Column(name="first_name", type="string", length=64)
	 */
	protected $firstName = "";

	/**
	 * @ORM\Column(name="last_name", type="string", length=64)
	 */
	protected $lastName = "";

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 */
	protected $thumbnail;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser", mappedBy="User")
	 */
	protected $workspaces;

	/**
	 * @var int
	 * @ORM\Column(name="connections", type="integer")
	 */
	protected $connections;

	/**
	 * @var int
	 * @ORM\Column(name="connected", type="boolean")
	 */
	protected $connected;

	/**
	 * @var int
	 * @ORM\Column(name="last_activity", type="bigint")
	 */
	protected $lastActivity = 0;

    /**
     * @var int
     * @ORM\Column(type="datetime",nullable=true, options={"default" : "1970-01-02"})
     */
    protected $creationDate;

	/**
	 * @ORM\Column(name="language", type="string", length=64)
	 */
	protected $language = "en";

    /**
     * @ORM\Column(name="notification_preference", type="string", length=2048)
     */
    protected $notification_preference = "{}";

    /**
     * @ORM\Column(name="phone", type="string", length=64)
     */
    protected $phone = "";

    /**
     * @ORM\Column(name="origin", type="string", length=64)
     */
    protected $origin = "";

    /**
     * @ORM\Column(name="isNew", type="boolean")
     */
    protected $isNew = true;



    public function __construct()
	{
		$this->enabled = true;
		$this->connections = 0;
		$this->connected = 1;
		$this->isRobot = false;
	}

	/**
	 * @return int
	 */
	public function getId()
	{
		return $this->id;
	}

	/**
	 * @return mixed
	 */
	public function getBanned()
	{
		return $this->banned;
	}

	/**
	 * @param mixed $banned
	 */
	public function setBanned($banned)
	{
		$this->banned = $banned;
	}

	/**
	 * @return mixed
	 */
	public function getFirstName()
	{
		return $this->firstName;
	}

	/**
	 * @param mixed $firstName
	 */
	public function setFirstName($firstName)
	{
		$this->firstName = $firstName;
	}

    /**
     * @return dateTime
     */
    public function getCreationDate()
    {
        return $this->creationDate;
    }

    /**
     * @param datetime $creationDate
     */
    public function setCreationDate($creationDate)
    {
        $this->creationDate = $creationDate;
    }

	/**
	 * @return mixed
	 */
	public function getLastName()
	{
		return $this->lastName;
	}

	/**
	 * @param mixed $lastName
	 */
	public function setLastName($lastName)
	{
		$this->lastName = $lastName;
	}

	/**
	 * @return mixed
	 */
	public function getThumbnail()
	{
		return $this->thumbnail;
	}

	/**
	 * @param mixed $thumbnail
	 */
	public function setThumbnail($thumbnail)
	{
		$this->thumbnail = $thumbnail;
	}

	public function getWorkspaces()
	{

		$workspaces = Array();

		for ($i = 0; $i < count($this->workspaces); ++$i) {
			$workspaces[] = $this->workspaces[$i]->getWorkspace();
		}

		return $workspaces;
	}

	public function isActive(){
		$this->lastActivity = date("U");
	}

	/* Manage connections with websocket */
	public function getConnections()
	{
		return $this->connections;
	}

	public function isConnected()
	{
		if(date("U") - $this->lastActivity > 120){
			$this->connected = false;
			return false;
		}
		return $this->connected;
	}

	public function resetConnection()
	{
		$this->connections = 0;
		$this->connected = false;
	}

	public function addConnection()
	{
		if(date("U") - $this->lastActivity > 120){
			$this->connections = 0;
		}
		$this->lastActivity = date("U");
		$this->connections += 1;
		$this->connected = true;
	}

	public function remConnection()
	{
		$this->connections = max(0, $this->connections - 1);
		$this->connected = $this->connections > 0;
	}

	/**
	 * @return mixed
	 */
	public function getLanguage()
	{
		return $this->language;
	}

	/**
	 * @param mixed $language
	 */
	public function setLanguage($language)
	{
		$this->language = $language;
	}

    /**
     * @return mixed
     */
    public function getPhone()
    {
        return $this->phone;
    }

    /**
     * @param mixed $phone
     */
    public function setPhone($phone)
    {
        $this->phone = $phone;
    }

    /**
     * @return mixed
     */
    public function getisNew()
    {
        return $this->isNew;
    }

    /**
     * @param mixed $isNew
     */
    public function setIsNew($isNew)
    {
        $this->isNew = $isNew;
    }

    /**
     * @return mixed
     */
    public function getOrigin()
    {
        return $this->origin;
    }

    /**
     * @param mixed $origin
     */
    public function setOrigin($origin)
    {
        if (!$origin) {
            $origin = "";
        }
        $this->origin = $origin;
    }

	/**
	 * @return mixed
	 */
	public function getNotificationPreference()
	{
		$preferences = json_decode($this->notification_preference, 1);
        $preferences["devices"] = (isset($preferences["devices"])) ? $preferences["devices"] : 0;
		$preferences["dont_disturb_between"] = (isset($preferences["dont_disturb_between"]))?$preferences["dont_disturb_between"]:null;
		$preferences["dont_disturb_and"] = (isset($preferences["dont_disturb_and"]))?$preferences["dont_disturb_and"]:null;
		$preferences["privacy"] = (isset($preferences["privacy"]))?$preferences["privacy"]:0;
		$preferences["dont_use_keywords"] = (isset($preferences["dont_use_keywords"]))?$preferences["dont_use_keywords"]:1;
		$preferences["keywords"] = (isset($preferences["keywords"]))?$preferences["keywords"]:"";
        $preferences["disabled_workspaces"] = (isset($preferences["disabled_workspaces"]))?$preferences["disabled_workspaces"]:[];
        $preferences["workspace"] = (isset($preferences["workspace"]))?$preferences["workspace"]:[];
        $preferences["mail_notifications"] = (isset($preferences["mail_notifications"])) ? $preferences["mail_notifications"] : 2;

		return $preferences;
	}

	/**
	 * @param mixed $notification_preference
	 */
	public function setNotificationPreference($notification_preference)
	{
		$preferences = Array();
		@$preferences["devices"] = intval($notification_preference["devices"]);
		@$preferences["dont_disturb_between"] = intval($notification_preference["disturb_before"]);
		@$preferences["dont_disturb_and"] = intval($notification_preference["disturb_after"]);
		@$preferences["privacy"] = intval($notification_preference["privacy"]);
		@$preferences["dont_use_keywords"] = intval($notification_preference["use_keywords"]);
		@$preferences["keywords"] = substr($notification_preference["keywords"], 0, 512);
        @$preferences["mail_notifications"] = intval($notification_preference["mail_notifications"]);

        foreach ($notification_preference["disabled_workspaces"] as $item) {
            @$preferences["disabled_workspaces"][] = intval($item);
        }

		$this->notification_preference = json_encode($notification_preference);
	}

	public function getAsArray()
	{
		$return = Array(
			"id" => $this->getId(),
			"username" => $this->getUsername(),
			"firstname" => $this->getFirstName(),
			"lastname" => $this->getLastName(),
			"thumbnail" => ($this->getThumbnail()==null)?null:$this->getThumbnail()->getPublicURL(2),
            "connected" => $this->isConnected(),
			"language" => $this->getLanguage(),
            "isNew" => $this->getisNew(),
            "isRobot" => $this->getisRobot()
		);
		return $return;
	}

    /**
     * @return mixed
     */
    public function getisRobot()
    {
        return $this->isRobot;
    }

    /**
     * @param mixed $isRobot
     */
    public function setIsRobot($isRobot)
    {
        $this->isRobot = $isRobot;
    }

    /**
     * @return int
     */
    public function getLastActivity()
    {
        return $this->lastActivity;
    }

    /**
     * @return \DateTime|null
     */
    public function getLastLogin()
    {
        return $this->lastLogin;
    }

}
