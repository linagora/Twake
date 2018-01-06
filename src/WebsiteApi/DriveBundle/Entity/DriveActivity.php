<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * DriveActivity
 *
 * @ORM\Table(name="drive_activity",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\DriveActivityRepository")
 */
class DriveActivity
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
	 * @ORM\Column(type="string", length=10)
	 */
	private $type;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User",cascade={"persist"})
	 * @ORM\JoinColumn(nullable=true)
	 */
	private $user;

	/**
	 * @ORM\Column(type="string", length=256)
	 */
	private $message;


	public function __construct($file, $type, $message, $user=null)
	{
		$this->file = $file;
		$this->message = $message;
		$this->type = ($type=="system")?$type:"comment";
		$this->user = $user;

	}

	public function getId()
	{
		return $this->id;
	}

	public function getAsArray(){

		$array = Array(
			"id" => $this->id,
			"type" => $this->type,
			"message" => $this->message,
			"file" => $this->file->getAsArray(),
			"user" => null
		);

		if($this->user){
			$array["user"] = $this->user->getAsArray();
		}

		return $array;
	}

}
