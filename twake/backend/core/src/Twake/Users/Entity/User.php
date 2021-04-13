<?php

namespace Twake\Users\Entity;

use Symfony\Component\Security\Core\User\UserInterface;
use Twake\Core\Entity\SearchableObject;
use Twake\Workspaces\Entity\LinkWorkspaceParent;
use Symfony\Component\Security\Core\User\UserInterface as BaseUserInterface;
use Doctrine\ORM\Mapping as ORM;


/**
 * User
 *
 * @ORM\Table(name="user",options={"engine":"MyISAM"})
 * @ORM\Entity()
 */
class User extends SearchableObject
{

    protected $es_type = "users";

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $id;

    /**
     * Used for cassandra session handler because timeuuid cannot be unserialized
     */
    public $id_as_string_for_session_handler;

    /**
     * @ORM\Column(name="banned", type="twake_boolean")
     */
    protected $banned = false;

    /**
     * @ORM\Column(name="is_robot", type="twake_boolean", options={"default" : false } )
     */
    protected $isrobot;

    /**
     * @ORM\Column(name="first_name", type="twake_text")
     */
    protected $firstname = "";

    /**
     * @ORM\Column(name="last_name", type="twake_text")
     */
    protected $lastname = "";

    /**
     * @ORM\ManyToOne(targetEntity="Twake\Upload\Entity\File")
     */
    protected $thumbnail; //Old format depreciated (now with console)

    /**
     * @ORM\Column(name="picture", type="twake_text")
     */
    protected $picture;

    /**
     * @ORM\Column(name="workspaces", type="twake_text")
     */
    protected $workspaces;

    /**
     * @ORM\Column(name="groups", type="twake_text")
     */
    protected $groups;

    /**
     * @var int
     * @ORM\Column(name="connections", type="integer")
     */
    protected $connections;

    /**
     * @var int
     * @ORM\Column(name="connected", type="twake_boolean")
     */
    protected $connected;

    /**
     * @var int
     * @ORM\Column(name="status_icon", type="string", length=64)
     */
    protected $status_icon = '["", ""]';

    /**
     * @var int
     * @ORM\Column(name="last_activity", type="twake_bigint")
     */
    protected $lastactivity = 0;

    /**
     * @var int
     * @ORM\Column(name="creation_date", type="twake_datetime",nullable=true, options={"default" : "1970-01-02"})
     */
    protected $creationdate;

    /**
     * @ORM\Column(name="language", type="string", length=64)
     */
    protected $language = "en";

    /**
     * @ORM\Column(name="notification_preference", type="twake_text")
     */
    protected $notification_preference = "{}";

    /**
     * @ORM\Column(name="notification_read_increment", type="twake_bigint")
     */
    protected $notification_read_increment = 0;

    /**
     * @ORM\Column(name="notification_write_increment", type="twake_bigint")
     */
    protected $notification_write_increment = 0;

    /**
     * @ORM\Column(name="workspaces_preference", type="twake_text")
     */
    protected $workspaces_preference = "{}";

    /**
     * @ORM\Column(name="tutorial_status", type="twake_text")
     */
    protected $tutorial_status = "{}";

    /**
     * @ORM\Column(name="phone", type="twake_text")
     */
    protected $phone = "";

    /**
     * @ORM\Column(name="identity_provider", type="twake_text")
     */
    protected $identity_provider = "";

    /**
     * @ORM\Column(name="identity_provider_id", type="twake_text")
     */
    protected $identity_provider_id = "";

    /**
     * @ORM\Column(name="token_login", type="twake_text")
     */
    protected $token_login = "";

    /**
     * @ORM\Column(name="origin", type="string", length=64)
     */
    protected $origin = "";

    /**
     * @ORM\Column(name="is_new", type="twake_boolean")
     */
    protected $isnew = true;

    /**
     * @ORM\Column(name="mail_verified", type="twake_boolean")
     */
    protected $mail_verified = false;

    /**
     * @ORM\Column(name="mail_verification_override", type="string")
     */
    protected $mail_verification_override = "";


    protected $username;

    /**
     * @ORM\Column(name="username_canonical", type="string", length=64, options={"index": true})
     */
    protected $usernamecanonical;

    protected $email;

    /**
     * @ORM\Column(name="email_canonical", type="string", length=512, options={"index": true})
     */
    protected $emailcanonical;

    /**
     * @ORM\Column(name="remember_me_secret", type="twake_text")
     */
    protected $remember_me_secret;


    /**
     * @ORM\Column(type="twake_boolean")
     */
    protected $enabled;

    /**
     * @ORM\Column(type="string", length=512, nullable=true)
     */
    protected $salt;

    /**
     * @ORM\Column(type="string", length=512)
     */
    protected $password;

    /**
     * @ORM\Column(type="string", length=16)
     */
    protected $timezone;

    /**
     * @ORM\Column(name="last_login", type="twake_datetime")
     */
    protected $lastlogin;

    /**
     * @ORM\Column(name="confirmation_token", type="string", nullable = true)
     */
    protected $confirmationtoken;

    /**
     * @ORM\Column(name="password_requested_at", type="twake_datetime")
     */
    protected $passwordrequestedat;

    /**
     * @ORM\Column(type="array")
     */
    protected $roles;


    public function __construct()
    {
        parent::__construct();
        $this->enabled = true;
        $this->connections = 0;
        $this->connected = 1;
        $this->isrobot = false;
        $this->roles = array();
        $this->lastlogin = new \DateTime();
        $this->passwordrequestedat = new \DateTime();

        $this->setCreationDate(new \DateTime());
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
        return $this->id . "";
    }

    public function setIdAsString()
    {
        if ($this->id && str_replace(Array("0", "-"), "", $this->id . "")) {
            $this->id_as_string_for_session_handler = $this->id . "";
        }
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
        return $this->firstname;
    }

    /**
     * @param mixed $firstname
     */
    public function setFirstName($firstname)
    {
        $this->firstname = $firstname;
    }

    /**
     * @return dateTime
     */
    public function getCreationDate()
    {
        return $this->creationdate;
    }

    /**
     * @param datetime $creationdate
     */
    public function setCreationDate($creationdate)
    {
        $this->creationdate = $creationdate;
    }

    /**
     * @return mixed
     */
    public function getLastName()
    {
        return $this->lastname;
    }

    /**
     * @param mixed $lastname
     */
    public function setLastName($lastname)
    {
        $this->lastname = $lastname;
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

    /**
     * @return mixed
     */
    public function getPicture()
    {
        if(!$this->picture){
            return $this->getThumbnail() ? $this->getThumbnail()->getPublicURL(2) : "";
        }
        return $this->picture ?: "";
    }

    /**
     * @param mixed $logo
     */
    public function setPicture($picture)
    {
        $this->picture = $picture;
    }

    public function isActive()
    {
        $this->lastactivity = date("U");
        $this->connected = true;
    }

    public function isConnected()
    {
        if (date("U") - $this->lastactivity > 60 * 5) {
            $this->connected = false;
            return false;
        }
        return $this->connected;
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
        return $this->isnew;
    }

    /**
     * @param mixed $isnew
     */
    public function setIsNew($isnew)
    {
        $this->isnew = $isnew;
    }

    public function getIdentityProvider()
    {
        return $this->identity_provider;
    }

    public function setIdentityProvider($identity_provider)
    {
        if (!$identity_provider) {
            $this->identity_provider = "";
        }
        $this->identity_provider = $identity_provider;
    }

    public function getIdentityProviderId()
    {
        return $this->identity_provider_id;
    }

    public function setIdentityProviderId($identity_provider_id)
    {
        if (!$identity_provider_id) {
            $this->identity_provider_id = "";
        }
        $this->identity_provider_id = $identity_provider_id;
    }

    public function getTokenLogin()
    {
        return json_decode(empty($this->token_login)?"{}":$this->token_login, 1);
    }

    public function setTokenLogin($token_login)
    {
        $this->token_login = json_encode($token_login);
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
        $preferences["dont_disturb_between"] = (isset($preferences["dont_disturb_between"])) ? $preferences["dont_disturb_between"] : null;
        $preferences["dont_disturb_and"] = (isset($preferences["dont_disturb_and"])) ? $preferences["dont_disturb_and"] : null;
        $preferences["privacy"] = (isset($preferences["privacy"])) ? $preferences["privacy"] : 0;
        $preferences["dont_use_keywords"] = (isset($preferences["dont_use_keywords"])) ? $preferences["dont_use_keywords"] : 1;
        $preferences["keywords"] = (isset($preferences["keywords"])) ? $preferences["keywords"] : "";
        $preferences["disabled_workspaces"] = (isset($preferences["disabled_workspaces"])) ? $preferences["disabled_workspaces"] : [];
        $preferences["workspace"] = (isset($preferences["workspace"])) ? $preferences["workspace"] : [];
        $preferences["mail_notifications"] = (isset($preferences["mail_notifications"])) ? $preferences["mail_notifications"] : 2;
        $preferences["disable_until"] = (isset($preferences["disable_until"])) ? $preferences["disable_until"] : 0;

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
        @$preferences["disable_until"] = (isset($notification_preference["disable_until"])) ? $notification_preference["disable_until"] : 0;

        foreach ($notification_preference["disabled_workspaces"] as $item) {
            @$preferences["disabled_workspaces"][] = intval($item);
        }

        $this->notification_preference = json_encode($notification_preference);
    }


    public function getTutorialStatus()
    {
        return json_decode($this->tutorial_status, true);
    }

    public function setTutorialStatus($tutorial_status)
    {
        @$this->tutorial_status = json_encode($tutorial_status);
    }

    public function getFullName()
    {
        $name = "@" . $this->getUsername();
        if ($this->getFirstName() && $this->getFirstName() != "") {
            $name = $this->getFirstName();
        }
        if ($this->getFirstName() && $this->getFirstName() != "" && $this->getLastName() && $this->getLastName() != "") {
            $name .= " " . $this->getLastName();
        }
        return ucwords($name);
    }

    public function getAsArray()
    {
        $return = Array(
            "id" => $this->getId(),
            "username" => $this->getUsername(),
            "firstname" => $this->getFirstName(),
            "lastname" => $this->getLastName(),
            "thumbnail" => (($this->getThumbnail() == null) ? null : $this->getThumbnail()->getPublicURL(2)) . "",
            "identity_provider" => $this->getIdentityProvider(),
            "connected" => $this->isConnected(),
            "language" => $this->getLanguage(),
            "isNew" => $this->getisNew(),
            "isRobot" => $this->getisRobot(),
            "status_icon" => $this->getStatusIcon(),
            "front_id" => $this->getFrontId(),
            "timezone_offset" => $this->timezone,
            "email" => $this->getEmail(),
            "mail_hash" => md5(trim(strtolower($this->getEmail()))),
            "mail_verification_override" => $this->getMailVerified() ? null : $this->getMailVerificationOverride(),
            "mail_verification_override_mail" => $this->getMailVerified() ? null : $this->getEmail(),
            "groups_id" => $this->getGroups(),
            "workspaces_id" => $this->getWorkspaces()
        );

        //Start - Compatibility with new model
        $return["id"] = $return["id"];
        $return["provider"] = $return["identity_provider"] ?: "internal";
        $return["provider_id"] = $this->getIdentityProviderId();

        $return["email"] = $return["email"];
        $return["is_verified"] = $this->getMailVerified();
        $return["picture"] = $return["thumbnail"];
        $return["first_name"] = $return["firstname"];
        $return["last_name"] = $return["lastname"];
        $return["created_at"] = ($this->getCreationDate() ? ($this->getCreationDate()->format('U') * 1000) : null);

        $return["preferences"] = [
            "locale" => $this->getLanguage(),
            "timezone" => $this->timezone,
        ];

        $return["status"] = trim(join(" ", $return["status_icon"]));
        $return["last_activity"] = $this->getLastActivity() * 1000;
        //End - Compatibility with new model
                    
        return $return;
    }

    public function getIndexationArray()
    {
        $return = Array(
            "email" => $this->getEmail(),
            "username" => $this->getUsername(),
            "firstname" => $this->getFirstName(),
            "lastname" => $this->getLastName(),
            "language" => $this->getLanguage(),
            "creation_date" => ($this->getCreationDate() ? $this->getCreationDate()->format('Y-m-d') : null),
            "groups_id" => $this->getGroups(),
            "workspaces_id" => $this->getWorkspaces()
        );
        return $return;
    }

    public function setGroups($ids)
    {
        $this->groups = json_encode($ids);
    }

    public function setWorkspaces($ids)
    {
        $this->workspaces = json_encode($ids);
    }

    public function getGroups()
    {
        return json_decode($this->groups, 1);
    }

    public function getWorkspaces()
    {
        return json_decode($this->workspaces, 1);
    }

    /**
     * @return mixed
     */
    public function getisRobot()
    {
        return $this->isrobot;
    }

    /**
     * @param mixed $isrobot
     */
    public function setIsRobot($isrobot)
    {
        $this->isrobot = $isrobot;
    }

    /**
     * @return int
     */
    public function getLastActivity()
    {
        return $this->lastactivity;
    }

    /**
     * @return \DateTime|null
     */
    public function getLastLogin()
    {
        return $this->lastlogin;
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
            $this->usernamecanonical,
            $this->username,
            $this->enabled,
            $this->id,
            $this->email,
            $this->emailcanonical,
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
            $this->usernamecanonical,
            $this->username,
            $this->enabled,
            $this->id,
            $this->email,
            $this->emailcanonical
            ) = $data;
    }

    /**
     * {@inheritdoc}
     */
    public function eraseCredentials()
    {
        $this->plainpassword = null;
    }

    /**
     * {@inheritdoc}
     */
    public function getUsername()
    {
        return $this->getusernameCanonical();
    }

    /**
     * {@inheritdoc}
     */
    public function getusernameCanonical()
    {
        return $this->usernamecanonical;
    }

    /**
     * {@inheritdoc}
     */
    public function getSalt()
    {
        return $this->salt;
    }

    /**
     * @return string
     */
    public function getEsType()
    {
        return $this->es_type;
    }


    /**
     * {@inheritdoc}
     */
    public function getEmail()
    {
        return $this->getemailCanonical();
    }

    /**
     * {@inheritdoc}
     */
    public function getemailCanonical()
    {
        return $this->emailcanonical;
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
    public function getConfirmationToken()
    {
        return $this->confirmationtoken;
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
        $this->usernamecanonical = $username;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setusernameCanonical($usernamecanonical)
    {
        $this->usernamecanonical = $usernamecanonical;

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
        $this->email = trim(strtolower($email));
        $this->emailcanonical = trim(strtolower($email));

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setemailCanonical($emailcanonical)
    {
        $this->emailcanonical = $emailcanonical;

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
        $this->plainpassword = $password;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setLastLogin(\DateTime $time = null)
    {
        $this->lastlogin = $time;

        return $this;
    }

    /**
     * @return mixed
     */
    public function getMailVerified()
    {
        return $this->mail_verified;
    }

    /**
     * @param mixed $mail_verified
     */
    public function setMailVerified($mail_verified)
    {
        $this->mail_verified = $mail_verified;
    }

    public function getMailVerifiedExtended($mail = null, $pseudo = null)
    {
        //Dans tous les cas si le mail est vérifié cet utilisateur est bloqué
        if ($this->getMailVerified()) {
            return true;
        }

        $override = (strlen($this->getMailVerificationOverride()) > 2);

        if ($override && $mail != null && $pseudo != null) {
            if (trim(strtolower($mail)) == trim(strtolower($this->getemailCanonical()))) {
                return false; //Cas spécial ou on authorise l'inscription et l'écrasement de l'utilisateur
            }
        }

        return $this->getMailVerified() || $override;
    }

    /**
     * @return mixed
     */
    public function getMailVerificationOverride()
    {
        return $this->mail_verification_override;
    }

    /**
     * @param mixed $mail_verification_override
     */
    public function setMailVerificationOverride($mail_verification_override): void
    {
        $this->mail_verification_override = $mail_verification_override;
    }

    /**
     * {@inheritdoc}
     */
    public function setConfirmationToken($confirmationtoken)
    {
        $this->confirmationtoken = $confirmationtoken;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setPasswordRequestedAt(\DateTime $date = null)
    {
        $this->passwordrequestedat = $date;

        return $this;
    }

    /**
     * Gets the timestamp that the user requested a password reset.
     *
     * @return null|\DateTime
     */
    public function getPasswordRequestedAt()
    {
        return $this->passwordrequestedat;
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


    public function isEqualTo(User $user)
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

    /**
     * @return int
     */
    public function getStatusIcon()
    {
        try {
            $status_icon = json_decode($this->status_icon, 1);
        } catch (\Exception $e) {
            $status_icon = Array("", "");
        }
        if (!$status_icon) {
            $status_icon = Array("", "");
        }
        return $status_icon;
    }

    /**
     * @param int $status_icon
     */
    public function setStatusIcon($status_icon)
    {
        try {
            $this->status_icon = json_encode($status_icon);
        } catch (\Exception $e) {
            $this->status_icon = '["", ""]';
        }
    }

    /**
     * @return mixed
     */
    public function getWorkspacesPreference()
    {
        try {
            $preferences = json_decode($this->workspaces_preference, 1);
        } catch (\Exception $e) {
            $preferences = Array();
        }
        if (!$preferences) {
            $preferences = Array();
        }
        return $preferences;
    }

    /**
     * @param mixed $workspaces_preference
     */
    public function setWorkspacesPreference($workspaces_preference)
    {
        try {
            $this->workspaces_preference = json_encode($workspaces_preference);
        } catch (\Exception $e) {
            $this->workspaces_preference = "{}";
        }
    }

    /**
     * @return mixed
     */
    public function getNotificationReadIncrement()
    {
        return $this->notification_read_increment;
    }

    /**
     * @param mixed $notification_read_increment
     */
    public function setNotificationReadIncrement($notification_read_increment)
    {
        $this->notification_read_increment = $notification_read_increment;
    }

    /**
     * @return mixed
     */
    public function getNotificationWriteIncrement()
    {
        return $this->notification_write_increment;
    }

    /**
     * @param mixed $notification_write_increment
     */
    public function setNotificationWriteIncrement($notification_write_increment)
    {
        $this->notification_write_increment = $notification_write_increment;
    }

    /**
     * @return mixed
     */
    public function getTimezone()
    {
        return $this->timezone;
    }

    /**
     * @param mixed $timezone
     */
    public function setTimezone($timezone)
    {
        $this->timezone = $timezone;
    }

    /**
     * @return mixed
     */
    public function getRememberMeSecret()
    {
        return $this->remember_me_secret;
    }

    /**
     * @param mixed $remember_me_secret
     */
    public function setRememberMeSecret($remember_me_secret)
    {
        $this->remember_me_secret = $remember_me_secret;
    }


}
