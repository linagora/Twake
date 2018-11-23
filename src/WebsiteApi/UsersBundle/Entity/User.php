<?php

namespace WebsiteApi\UsersBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use FOS\UserBundle\Model\User as BaseUser;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceParent;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use Symfony\Component\Security\Core\User\UserInterface as BaseUserInterface;

/**
 * User
 *
 * @ORM\Table(name="user",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\UsersBundle\Repository\UserRepository")
 */
class User implements UserInterface
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
     * @ORM\Column(name="banned", type="cassandra_boolean")
	 */
	protected $banned = false;

    /**
     * @ORM\Column(name="is_robot", type="cassandra_boolean", options={"default" : false } )
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
     * @ORM\Column(name="connected", type="cassandra_boolean")
	 */
	protected $connected;

	/**
	 * @var int
	 * @ORM\Column(name="last_activity", type="bigint")
	 */
	protected $lastActivity = 0;

    /**
     * @var int
     * @ORM\Column(name="creation_date", type="cassandra_datetime",nullable=true, options={"default" : "1970-01-02"})
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
     * @ORM\Column(name="is_new", type="cassandra_boolean")
     */
    protected $isNew = true;

    /**
     * @ORM\Column(type="string", length=64, options={"index": true})
     */
    protected $username;

    /**
     * @ORM\Column(name="username_canonical", type="string", length=64, options={"index": true})
     */
    protected $usernameCanonical;

    /**
     * @ORM\Column(type="string", length=512, options={"index": true})
     */
    protected $email;

    /**
     * @ORM\Column(name="email_canonical", type="string", length=512, options={"index": true})
     */
    protected $emailCanonical;

    /**
     * @ORM\Column(type="cassandra_boolean")
     */
    protected $enabled;

    /**
     * @ORM\Column(type="string", length=512)
     */
    protected $salt;

    /**
     * @ORM\Column(type="string", length=512)
     */
    protected $password;

    /**
     * @ORM\Column(name="last_login", type="cassandra_datetime")
     */
    protected $lastLogin;

    /**
     * @ORM\Column(name="confirmation_token", type="string", nullable = true)
     */
    protected $confirmationToken;

    /**
     * @ORM\Column(name="password_requested_at", type="cassandra_datetime")
     */
    protected $passwordRequestedAt;

    /**
     * @ORM\Column(type="array")
     */
    protected $roles;



    public function __construct()
	{
		$this->enabled = true;
		$this->connections = 0;
		$this->connected = 1;
		$this->isRobot = false;
        $this->roles = array();
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


    /**
     * @return string
     */
    public function __toString()
    {
        return (string)$this->getUsername();
    }

    /**
     * {@inheritdoc}
     */
    public function addRole($role)
    {
        $role = strtoupper($role);
        if ($role === static::ROLE_DEFAULT) {
            return $this;
        }

        if (!in_array($role, $this->roles, true)) {
            $this->roles[] = $role;
        }

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function serialize()
    {
        return serialize(array(
            $this->password,
            $this->salt,
            $this->usernameCanonical,
            $this->username,
            $this->enabled,
            $this->id,
            $this->email,
            $this->emailCanonical,
        ));
    }

    /**
     * {@inheritdoc}
     */
    public function unserialize($serialized)
    {
        $data = unserialize($serialized);

        if (13 === count($data)) {
            // Unserializing a User object from 1.3.x
            unset($data[4], $data[5], $data[6], $data[9], $data[10]);
            $data = array_values($data);
        } elseif (11 === count($data)) {
            // Unserializing a User from a dev version somewhere between 2.0-alpha3 and 2.0-beta1
            unset($data[4], $data[7], $data[8]);
            $data = array_values($data);
        }

        list(
            $this->password,
            $this->salt,
            $this->usernameCanonical,
            $this->username,
            $this->enabled,
            $this->id,
            $this->email,
            $this->emailCanonical
            ) = $data;
    }

    /**
     * {@inheritdoc}
     */
    public function eraseCredentials()
    {
        $this->plainPassword = null;
    }

    /**
     * {@inheritdoc}
     */
    public function getUsername()
    {
        return $this->username;
    }

    /**
     * {@inheritdoc}
     */
    public function getUsernameCanonical()
    {
        return $this->usernameCanonical;
    }

    /**
     * {@inheritdoc}
     */
    public function getSalt()
    {
        return $this->salt;
    }

    /**
     * {@inheritdoc}
     */
    public function getEmail()
    {
        return $this->email;
    }

    /**
     * {@inheritdoc}
     */
    public function getEmailCanonical()
    {
        return $this->emailCanonical;
    }

    /**
     * {@inheritdoc}
     */
    public function getPassword()
    {
        return $this->password;
    }

    /**
     * {@inheritdoc}
     */
    public function getPlainPassword()
    {
        return $this->plainPassword;
    }

    /**
     * {@inheritdoc}
     */
    public function getConfirmationToken()
    {
        return $this->confirmationToken;
    }

    /**
     * {@inheritdoc}
     */
    public function getRoles()
    {
        $roles = $this->roles;

        // we need to make sure to have at least one role
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    /**
     * {@inheritdoc}
     */
    public function hasRole($role)
    {
        return in_array(strtoupper($role), $this->getRoles(), true);
    }

    /**
     * {@inheritdoc}
     */
    public function isAccountNonExpired()
    {
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function isAccountNonLocked()
    {
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function isCredentialsNonExpired()
    {
        return true;
    }

    public function isEnabled()
    {
        return $this->enabled;
    }

    /**
     * {@inheritdoc}
     */
    public function isSuperAdmin()
    {
        return $this->hasRole(static::ROLE_SUPER_ADMIN);
    }

    /**
     * {@inheritdoc}
     */
    public function removeRole($role)
    {
        if (false !== $key = array_search(strtoupper($role), $this->roles, true)) {
            unset($this->roles[$key]);
            $this->roles = array_values($this->roles);
        }

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setUsername($username)
    {
        $this->username = $username;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setUsernameCanonical($usernameCanonical)
    {
        $this->usernameCanonical = $usernameCanonical;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setSalt($salt)
    {
        $this->salt = $salt;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setEmail($email)
    {
        $this->email = $email;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setEmailCanonical($emailCanonical)
    {
        $this->emailCanonical = $emailCanonical;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setEnabled($boolean)
    {
        $this->enabled = (bool)$boolean;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setPassword($password)
    {
        $this->password = $password;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setSuperAdmin($boolean)
    {
        if (true === $boolean) {
            $this->addRole(static::ROLE_SUPER_ADMIN);
        } else {
            $this->removeRole(static::ROLE_SUPER_ADMIN);
        }

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setPlainPassword($password)
    {
        $this->plainPassword = $password;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setLastLogin(\DateTime $time = null)
    {
        $this->lastLogin = $time;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setConfirmationToken($confirmationToken)
    {
        $this->confirmationToken = $confirmationToken;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setPasswordRequestedAt(\DateTime $date = null)
    {
        $this->passwordRequestedAt = $date;

        return $this;
    }

    /**
     * Gets the timestamp that the user requested a password reset.
     *
     * @return null|\DateTime
     */
    public function getPasswordRequestedAt()
    {
        return $this->passwordRequestedAt;
    }

    /**
     * {@inheritdoc}
     */
    public function isPasswordRequestNonExpired($ttl)
    {
        return $this->getPasswordRequestedAt() instanceof \DateTime &&
            $this->getPasswordRequestedAt()->getTimestamp() + $ttl > time();
    }

    /**
     * {@inheritdoc}
     */
    public function setRoles(array $roles)
    {
        $this->roles = array();

        foreach ($roles as $role) {
            $this->addRole($role);
        }

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function isEqualTo(BaseUserInterface $user)
    {
        if (!$user instanceof self) {
            return false;
        }

        if ($this->password !== $user->getPassword()) {
            return false;
        }

        if ($this->salt !== $user->getSalt()) {
            return false;
        }

        if ($this->username !== $user->getUsername()) {
            return false;
        }

        return true;
    }

}
