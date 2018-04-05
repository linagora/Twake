<?php

namespace WebsiteApi\WorkspacesBundle\Entity;

use Doctrine\ORM\Mapping as ORM;




/**
 * Workspace
 *
 * @ORM\Table(name="workspace",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\WorkspacesBundle\Repository\WorkspaceRepository")
 */
class Workspace
{

    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

	/**
	 * @ORM\Column(name="name", type="string", length=50, nullable=true)
	 */
	private $name;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 */
	private $logo;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UploadBundle\Entity\File")
	 */
	private $wallpaper;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Group")
	 */
	private $group;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
	private $user;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser", mappedBy="workspace")
	 */
	private $members;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date_added;

	/**
	 * @ORM\Column(type="boolean")
	 */
	private $isDeleted = false;



	public function __construct($name) {
		$this->name = $name;
		$this->date_added = new \DateTime();
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
	public function getDateAdded()
	{
		return $this->date_added;
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
	public function getLogo()
	{
		return $this->logo;
	}

	/**
	 * @param mixed $logo
	 */
	public function setLogo($logo)
	{
		$this->logo = $logo;
	}

	/**
	 * @return mixed
	 */
	public function getWallpaper()
	{
		return $this->wallpaper;
	}

	/**
	 * @param mixed $logo
	 */
	public function setWallpaper($w)
	{
		$this->wallpaper = $w;
	}

	/**
	 * @return mixed
	 */
	public function getGroup()
	{
		return $this->group;
	}

	/**
	 * @param mixed $group
	 */
	public function setGroup($group)
	{
		$this->group = $group;
	}

	/**
	 * @return mixed
	 */
	public function getUser()
	{
		return $this->user;
	}

	/**
	 * @param mixed $user
	 */
	public function setUser($user)
	{
		$this->user = $user;
	}

	/**
	 * @return mixed
	 */
	public function getisDeleted()
	{
		return $this->isDeleted;
	}

	/**
	 * @param mixed $isDeleted
	 */
	public function setIsDeleted($isDeleted)
	{
		$this->isDeleted = $isDeleted;
	}

	/**
	 * @return mixed
	 */
	public function getMembers()
	{
		return $this->members;
	}

	public function getAsArray(){
		return Array(
			"id"=> $this->getId(),
			"private" => $this->getUser()!=null,
			"logo" => (($this->getLogo())?$this->getLogo()->getPublicURL():""),
			"wallpaper" => (($this->getWallpaper())?$this->getWallpaper()->getPublicURL():""),
			"group" => (($this->getGroup())?$this->getGroup()->getAsArray():null),
			"name" => $this->getName()
		);
	}

}
