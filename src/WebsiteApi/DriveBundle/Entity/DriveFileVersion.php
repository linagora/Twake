<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\UsersBundle\Entity\User;

/**
 * DriveFile
 *
 * @ORM\Table(name="drive_file_version",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\DriveFileRepository")
 */
class DriveFileVersion
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
    s*/
    private $id;

	/**
     * @ORM\Column(name="file_id", type="twake_timeuuid")
	 */
    private $file_id;

    /**
     * @ORM\Column(name="creator_id", type="twake_text")
     */
    private $creator_id;

	/**
     * @ORM\Column(type="twake_text")
     * @Encrypted
	 */
    private $realname;

	/**
     * @ORM\Column(name="aes_key", type="twake_text")
     * @Encrypted
	 */
	private $key;

	/**
     * @ORM\Column(type="twake_text")
     * @Encrypted
	 */
	private $mode = "OpenSSL-2";

	/**
     * @ORM\Column(type="integer")
	 */
	private $size;

	/**
     * @ORM\Column(type="twake_datetime")
	 */
	private $date_added;

    /**
     * @ORM\Column(type="twake_text")
     * @Encrypted
     */
    private $filename;


    public function __construct(DriveFile $file, $user_id)
	{
        $this->file_id = $file->getId();
		$this->setKey(base64_encode(random_bytes(256)));
		$this->setSize(0);
		$this->resetRealName();
		$this->date_added = new \DateTime();
		$this->setFileName($file->getName());
        $this->setUserId($user_id);
	}

	/**
	 * @return mixed
	 */
	public function setId($id)
    {
        $this->id = $id;
    }

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
        return $this->realname;
	}

	/**
     * @param mixed $realname
	 */
	public function resetRealName()
	{
        $this->realname = sha1(microtime() . rand(0, 10000)) . ".tw";
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
	public function getMode()
	{
		if(!$this->mode){
			return "AES";
		}
		return $this->mode;
	}

	public function getAsArray(){
	    return Array(
	        "id" => $this->id,
            "name" => $this->getFileName(),
            "added" => $this->date_added->getTimestamp(),
            "size" => $this->size,
            "user" => $this->user!=null ? $this->user->getId() != 0 ? $this->user->getAsArray() : "" : ""
            );
    }

    /**
     * @return mixed
     */
    public function getFileName()
    {
        return $this->filename;
    }

    /**
     * @param mixed $filename
     */
    public function setFileName($filename)
    {
        $this->filename = $filename;
    }

    /**
     * @return mixed
     */
    public function getUserId()
    {
        return $this->creator_id;
    }

    /**
     * @param mixed $user
     */
    public function setUserId($user)
    {
        $this->creator_id = $user;
    }

    /**
     * @return mixed
     */
    public function getDateAdded()
    {
        return $this->date_added;
    }

    /**
     * @param mixed $date_added
     */
    public function setDateAdded($date_added)
    {
        $this->date_added = $date_added;
    }

    /**
     * @return mixed
     */
    public function getFileId()
    {
        return $this->file_id;
    }

    /**
     * @param mixed $file_id
     */
    public function setFileId($file_id)
    {
        $this->file_id = $file_id;
    }




}
