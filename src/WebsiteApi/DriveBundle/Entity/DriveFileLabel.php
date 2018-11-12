<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * DriveFileLabel
 *
 * @ORM\Table(name="drive_file_label",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\DriveFileLabelRepository")
 */
class DriveFileLabel
{

	/**
     * @ORM\Column(name="id", type="cassandra_timeuuid")
	 * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
	 */
	private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile",cascade={"persist"})
	 * @ORM\JoinColumn(nullable=false)
	 */
	private $file;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DriveBundle\Entity\DriveLabel",cascade={"persist"})
     * @ORM\JoinColumn(nullable=false)
     */
    private $label;

	public function __construct($file, $label){
		$this->label = $label;
		$this->file = $file;
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
	public function getFile()
	{
		return $this->file;
	}

	/**
	 * @param mixed $file
	 */
	public function setFile($file)
	{
		$this->file = $file;
	}

	/**
	 * @return mixed
	 */
	public function getLabel()
	{
		return $this->label;
	}

	/**
	 * @param mixed $label
	 */
	public function setLabel($label)
	{
		$this->label = $label;
	}

}
