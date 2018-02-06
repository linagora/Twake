<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * DriveFile
 *
 * @ORM\Table(name="drive_file_version",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\DriveFileRepository")
 */
class DriveFileVersion
{
    /**
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile",cascade={"persist"})
	 * @ORM\JoinColumn(nullable=false)
	 */
	private $file;

	/**
	 * @ORM\Column(type="string", length=255)
	 */
	private $realName;

	/**
	 * @ORM\Column(name="aes_key", type="string", length=1024)
	 */
	private $key;

	/**
	 * @ORM\Column(type="integer")
	 */
	private $size;

	/**
	 * @ORM\Column(type="datetime")
	 */
	private $date_added;

	public function __construct($file)
	{
		$this->file = $file;
		$this->setKey(base64_encode(random_bytes(256)));
		$this->setSize(0);
		$this->resetRealName();
		$this->date_added = new \DateTime();
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
	public function getKey()
	{
		return $this->key;
	}

	/**
	 * @param mixed $key
	 */
	public function setKey($key)
	{
		$this->key = $key;
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
		$this->realName = sha1(microtime() . rand(0, 10000)) . ".tw";
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


}
