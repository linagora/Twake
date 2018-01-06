<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * DriveFile
 *
 * @ORM\Table(name="drive_file",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\DriveFileRepository")
 */
class DriveFile
{
    /**
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 */
	private $group;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile")
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $parent;

	/**
	 * @ORM\Column(type="string", length=255)
	 */
	private $name;

	/**
	 * @ORM\Column(type="string", length=2048)
	 */
	private $description;

	/**
	 * @ORM\Column(type="string", length=255)
	 */
	private $realName;

	/**
	 * @ORM\Column(type="integer")
	 */
	private $size;

	/**
	 * @ORM\Column(type="boolean")
	 */
	private $isDirectory;

	/**
	 * @ORM\Column(type="boolean")
	 */
	private $isInTrash;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile")
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $oldParent;

	/**
	 * @ORM\OneToMany(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile", mappedBy="parent")
	 */
	private $children;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $added;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $last_modified;


	public function __construct($group, $parent, $name, $isDirectory = false)
	{

		$this->group = $group;
		$this->setParent($parent);
		$this->setName($name);
		$this->resetRealName();
    	$this->setSize(0);
		$this->isDirectory = $isDirectory;
    	$this->setIsInTrash(false);

	}

	public function getId()
	{
		return $this->id;
	}

	/**
	 * @return mixed
	 */
	public function getGroup()
	{
		return $this->group;
	}
	/**
	 * @return mixed
	 */
	public function getParent()
	{
		return $this->parent;
	}

	/**
	 * @param mixed $parent
	 */
	public function setParent($parent)
	{
		$this->parent = $parent;
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
	public function getRealName()
	{
		return $this->realName;
	}

	/**
	 * @param mixed $realName
	 */
	public function resetRealName()
	{
		$this->realName = sha1(microtime() . rand(0, 10000));
	}

	/**
	 * @return mixed
	 */
	public function getSize()
	{
		return $this->size;
	}

	/**
	 * @param mixed $size
	 */
	public function setSize($size)
	{
		$this->size = $size;
	}

	/**
	 * @return mixed
	 */
	public function getIsDirectory()
	{
		return $this->isDirectory;
	}

	/**
	 * @return mixed
	 */
	public function getIsInTrash()
	{
		return $this->isInTrash;
	}

	/**
	 * @param mixed $isInTrash
	 */
	public function setIsInTrash($isInTrash)
	{
		$this->isInTrash = $isInTrash;
	}

	/**
	 * @return mixed
	 */
	public function getOldParent()
	{
		return $this->oldParent;
	}

	/**
	 * @param mixed $oldParent
	 */
	public function setOldParent($oldParent)
	{
		$this->oldParent = $oldParent;
	}

	/**
	 * @return mixed
	 */
	public function getChildren()
	{
		return $this->children;
	}

	/**
	 * Generate path from group id and realName
	 */
	public function getPath()
	{
		return $this->group->getId() . "/" . $this->getRealName();
	}

	public function getArray()
	{

		return Array(
			'id' => $this->getId(),
			'name' => $this->getName(),
			'size' => $this->getSize(),
			'isDirectory' => $this->getIsDirectory()
		);
	}


}
