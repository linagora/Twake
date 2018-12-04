<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * DriveLabel
 *
 * @ORM\Table(name="drive_smart_folder",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\DriveSmartFolderRepository")
 */
class DriveSmartFolder
{


	/**
     * @ORM\Column(name="id", type="cassandra_timeuuid")
	 * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
	 */
	private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
	 * @ORM\JoinColumn(nullable=false)
	 */
	private $group;

	/**
	 * @ORM\Column(type="string", length=32)
	 */
	private $name;

	/**
	 * @ORM\Column(type="string", length=512)
	 */
	private $labels;


	public function __construct($group, $name, $labels){
		$this->group = $group;
		$this->name = $name;
		$this->setLabels($labels);
	}

	/**
	 * @return mixed
	 */
	public function getId()
	{
		return $this->id;
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
	public function getLabels()
	{
		return json_decode($this->labels, 1);
	}

	/**
	 * @param mixed $labels
	 */
	public function setLabels($labels)
	{
		$this->labels = json_encode($labels);
	}

	/**
	 * @return mixed
	 */
	public function getGroup()
	{
		return $this->group;
	}

}
