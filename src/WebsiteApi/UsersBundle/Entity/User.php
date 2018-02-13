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
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;

	/**
	 * @ORM\Column(name="banned", type="boolean")
	 */
	protected $banned = false;

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


	public function __construct()
	{
		$this->enabled = true;
		$this->connections = 0;
		$this->connected = 1;
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

	public function getAsArray()
	{
		$return = Array(
			"id" => $this->getId(),
			"username" => $this->getUsername(),
			"firstname" => $this->getFirstName(),
			"lastname" => $this->getLastName(),
			"thumbnail" => ($this->getThumbnail()==null)?null:$this->getThumbnail()->getPublicURL(2),
		);
		return $return;
	}

}
