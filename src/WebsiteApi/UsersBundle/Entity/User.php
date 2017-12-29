<?php

namespace WebsiteApi\UsersBundle\Entity;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\Security\Core\User\UserInterface;

use Doctrine\ORM\Mapping as ORM;
use FOS\UserBundle\Model\User as BaseUser;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceParent;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceUser;

/**
 * User
 *
 * @ORM\Table(name="user",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\CoreBundle\Repository\UserRepository")
 */
class User extends BaseUser
{
	/**
	 * @var int
	 *
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;

	/**
	 * @ORM\Column(name="last_activity", type="bigint")
	 */
	protected $last_activity = 0;

	/**
	 * @ORM\Column(name="signupdone", type="boolean")
	 */
	protected $signupdone = false;

	/**
	 * @ORM\Column(name="username_clean", type="string", length=180)
	 */
	protected $username_clean = "";

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\UsersBundle\Entity\Mail", mappedBy="user")
	 */
	protected $secondary_mails;

	/**
	 * @ORM\Column(name="firstname", type="string", length=180)
	 */
	protected $firstname = "";

	/**
	 * @ORM\Column(name="lastname", type="string", length=180)
	 */
	protected $lastname = "";

	/**
	 * @ORM\Column(name="gender", type="string", length=1)
	 */
	protected $gender = "";

	/**
	 * @ORM\Column(name="description", type="text")
	 */
	protected $description = "";


	/**
	 * @ORM\Column(name="birthdate", type="string", length=10)
	 */
	protected $birthdate = "";


	/**
	 * @ORM\Column(name="data", type="text")
	 */
	protected $data = "{}";

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 */
	protected $thumbnail;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 */
	protected $cover;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceUser", mappedBy="User")
	 */
	protected $workspacesLinks;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\WorkspacesBundle\Entity\WorkspaceSubscription", mappedBy="user")
	 */
	protected $subscriptions;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\MarketBundle\Entity\LinkAppUser", mappedBy="user")
	 */
	protected $applicationsLinks;

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
	 *
	 * @ORM\Column(name="tokenReset", type="string",nullable=true)
	 */
	protected $tokenReset;

	/**
	 *
	 * @ORM\Column(name="dateReset", type="datetime",nullable=true)
	 */
	protected $dateReset;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\UsersBundle\Entity\Contact", mappedBy="userA")
	 */
	protected $contactsB;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\UsersBundle\Entity\Contact", mappedBy="userB")
	 */
	protected $contactsA;


	public function __construct()
	{
		$this->connections = 0;
		$this->connected = false;
	}

	public function getContacts()
	{

		$users = Array();

		foreach ($this->contactsA as $contact) {
			if ($contact->getStatus() == "A") {
				$users[] = $contact->getUserA();
			}
		}
		foreach ($this->contactsB as $contact) {
			if ($contact->getStatus() == "A") {
				$users[] = $contact->getUserB();
			}
		}

		return $users;
	}

	public function getSubscriptions()
	{
		return $this->subscriptions;
	}

	public function signupDone()
	{
		$this->signupdone = true;
	}

	public function isSignupDone()
	{
		return $this->signupdone;
	}

	public function getUsernameClean()
	{
		return $this->username_clean;
	}

	public function getProfileImage()
	{
		return $this->thumbnail;
	}

	public function getCoverImage()
	{
		return $this->cover;
	}

	public function setUsernameClean($usernameClean)
	{
		$this->username_clean = $usernameClean;
	}

	public function setUsername($username)
	{
		$username = str_replace("@", "", $username);

		parent::setUsername($username);
	}

	public function getFirstname()
	{
		return $this->firstname;
	}

	public function setFirstname($firstname)
	{
		$this->firstname = $firstname;
	}

	public function getLastname()
	{
		return $this->lastname;
	}

	public function setLastname($lastname)
	{
		$this->lastname = $lastname;
	}

	public function getGender()
	{
		return $this->gender;
	}

	public function setGender($gender)
	{
		if (!in_array($gender, Array("M", "F", "A"))) {
			$gender = "";
		}
		$this->gender = $gender;
	}

	public function getDescription()
	{
		return $this->description;
	}

	public function setDescription($description)
	{
		$description = substr($description, 0, 2048);
		$this->description = $description;
	}

	public function setThumbnail($thumbnail)
	{
		$this->thumbnail = $thumbnail;
	}

	public function getThumbnail()
	{
		return $this->thumbnail;
	}

	public function setCover($cover)
	{
		$this->cover = $cover;
	}

	public function getCover()
	{
		return $this->cover;
	}

	public function getCssProfileImage()
	{
		if ($this->getProfileImage() == null) {
			return "";
		}
		return "background-image: url('" . $this->getProfileImage()->getPublicURL(2) . "');";
	}

	public function getCssCoverImage()
	{
		if ($this->getCoverImage() == null) {
			return "";
		}
		return "background-image: url('" . $this->getCoverImage()->getPublicURL(0) . "');";
	}

	public function getUrlProfileImage()
	{
		if ($this->getProfileImage() == null) {
			return "";
		}
		return $this->getProfileImage()->getPublicURL(2);
	}

	public function getUrlCoverImage()
	{
		if ($this->getCoverImage() == null) {
			return "";
		}
		return $this->getCoverImage()->getPublicURL(0);
	}

	public function getSecondaryMails()
	{
		return $this->secondary_mails;
	}

	public function setSecondaryMails($secondary_mails)
	{
		$this->secondary_mails = $secondary_mails;
	}

	public function hasSecondaryMails()
	{
		return count($this->secondary_mails) > 0;
	}

	var $default_privacy = Array(
		"gender" => "public",
		"lastname" => "contacts",
		"firstname" => "contacts",
		"birthday" => "contacts",
		"hobbies" => "public",
		"friends" => "contacts",
		"groups" => "public",
		"email" => "private",
		"phone1" => "private",
		"phone2" => "private",
		"subscriptions" => "private",
	);

	var $default_data = Array(
		"privacy" => Array(),
		"phone1" => "",
		"phone2" => "",
	);

	/**
	 * @return mixed
	 */
	public function getData()
	{
		$data = json_decode($this->data, 1);
		//Default values
		foreach ($this->default_data as $key => $value) {
			if (!isset($data[$key])) {
				$data[$key] = $value;
			}
		}
		//Default values for privacy
		foreach ($this->default_privacy as $key => $value) {
			if (!isset($data['privacy'][$key])) {
				$data['privacy'][$key] = $value;
			}
		}

		foreach ($this->secondary_mails as $mail) {
			if (!isset($data['privacy']["emails"][$mail->getId()])) {
				$data['privacy']['emails'][$mail->getId()] = 'private';
			}
		}

		foreach ($this->workspacesLinks as $workspaceL) {
			if (!isset($data['privacy']['workspaces'][$workspaceL->getGroup()->getId()])) {
				$data['privacy']['workspaces'][$workspaceL->getGroup()->getId()] = 'public';
			}
		}

		return $data;
	}

	public function getPrivacy($param)
	{
		$data = $this->getData();
		if (!isset($data['privacy'])) {
			return "private";
		}
		if (!isset($data['privacy'][$param])) {
			return "private";
		}
		return $data['privacy'][$param];
	}

	public function getEmailPrivacy($email)
	{

		$data = $this->getData();

		foreach ($this->secondary_mails as $mail) {
			if ($mail->getMail() == $email) {
				return $data['privacy']["emails"][$mail->getId()];
			}
		}

		return "private";
	}

	public function getWorkspacePrivacy($workspaceId)
	{

		$data = $this->getData();

		foreach ($this->workspacesLinks as $workspaceLink) {
			if ($workspaceLink->getGroup()->getId() == $workspaceId) {
				return $data['privacy']["workspaces"][$workspaceId];
			}
		}

		return "private";
	}

	public function getEmailsPrivacy()
	{
		return $this->getData()['privacy']['emails'];
	}

	public function setPrivacy($param, $value)
	{

		$data = $this->getData();
		$data['privacy'][$param] = $value;
		$this->setData($data);
	}

	public function setEmailsPrivacy($param, $value)
	{
		$data = $this->getData();
		$data['privacy']['emails'][$param] = $value;
		$this->setData($data);
	}

	public function setWorkspacesPrivacy($param, $value)
	{
		$data = $this->getData();
		$data['privacy']['workspaces'][$param] = $value;
		$this->setData($data);
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
	public function getBirthdate()
	{
		return $this->birthdate;
	}

	/**
	 * @param mixed $birthdate
	 */
	public function setBirthdate($birthdate)
	{
		$this->birthdate = $birthdate;
	}

	/** Manage tags for users **/
	public function setTags($tags_service, $tags_list, $can_create = 0)
	{
		$tags_service->setTags($tags_list, "user", $this->getId(), "A", $can_create);
	}

	public function getTags($tags_service)
	{
		return $tags_service->getTags("user", $this->getId());
	}

	public function getWorkspaces()
	{

		$workspaces = Array();

		for ($i = 0; $i < count($this->workspacesLinks); ++$i) {
			if ($this->workspacesLinks[$i]->getStatus() != "P" && !$this->workspacesLinks[$i]->getGroup()->getIsDeleted()) {
				$workspaces[] = $this->workspacesLinks[$i]->getGroup();
			}
		}

		return $workspaces;
	}

	public function getAllWorkspaces()
	{
		$data = Array();

		for ($i = 0; $i < count($this->workspacesLinks); ++$i) {
			$workspace = $this->workspacesLinks[$i]->getGroup();
			if (!$workspace->getIsDeleted()) {
				$data[] = Array(
					"status" => $this->workspacesLinks[$i]->getStatus(),
					"workspace" => $workspace->getAsSimpleArray()
				);
			}
		}

		return $data;
	}

	public function getWorkspacesPart($limit, $offset)
	{

		$workspaces = Array();
		$firstValue = min($offset, count($this->workspacesLinks));

		for ($i = $firstValue; $i < min($firstValue + $limit, count($this->workspacesLinks)); ++$i) {
			$workspaces[] = $this->workspacesLinks[$i]->getGroup();
		}

		return $workspaces;
	}


	/* Manage connections with websocket */
	public function getConnections()
	{
		return $this->connections;
	}

	public function isConnected()
	{
		return $this->connected;
	}

	public function addConnection()
	{
		$this->connections += 1;
		$this->connected = true;
	}

	public function remConnection()
	{
		$this->connections = max(0, $this->connections - 1);
		$this->connected = $this->connections > 0;
	}


	public function setTokenReset($x)
	{
		$this->tokenReset = $x;
	}

	public function getTokenReset()
	{
		return $this->tokenReset;
	}

	public function setDateReset($x)
	{
		$this->dateReset = $x;
	}

	public function getDateReset()
	{
		return $this->dateReset;
	}

	public function newTokenReset()
	{
		$token = hash("sha256", random_bytes(10));
		$this->setTokenReset($token);
		$this->setDateReset(new \DateTime("now"));
	}


	public function getAsSimpleArray()
	{
		return Array(
			"uid" => $this->getId(),
			"id" => $this->getId(),
			"username" => $this->getUsername(),
			"susername" => $this->getUsernameClean(),
			"cssuserimage" => $this->getCssProfileImage(),
			"connected" => $this->isConnected(),
            "userimage" => $this->getUrlProfileImage(),
		);
	}
    public function getArray()
    {
        return Array(
            "id" => $this->getId(),
            "username" => $this->getUsername(),
            "susername" => $this->getUsernameClean(),
            "userimage" => $this->getUrlProfileImage(),
            "connected" => $this->isConnected()
        );
    }

}
