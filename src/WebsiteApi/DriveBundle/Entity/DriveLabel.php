<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * DriveLabel
 *
 * @ORM\Table(name="drive_label",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\DriveLabelRepository")
 */
class DriveLabel
{


	/**
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace",cascade={"persist"})
	 * @ORM\JoinColumn(nullable=false)
	 */
	private $workspace;

	/**
	 * @ORM\Column(type="string", length=32)
	 */
	private $name;

	/**
	 * @ORM\Column(type="string", length=6)
	 */
	private $color;

    /**
     * @ORM\Column(name="number", type="integer")
     */
    private $number = 0;


	public function __construct($workspace, $name, $color="000000"){
		$this->workspace = $workspace;
		$this->name = $name;
		$this->setColor($color);
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
	public function getColor()
	{
		return str_replace("#","", $this->color);
	}

	/**
	 * @param mixed $color
	 */
	public function setColor($color)
	{
		$this->color = str_replace("#","", $color);
	}

    /**
     * @return mixed
     */
    public function getWorkspace()
    {
        return $this->workspace;
    }

    /**
     * @return mixed
     */
    public function getNumber()
    {
        return $this->number;
    }

    /**
     * @param mixed $number
     */
    public function setNumber($number)
    {
        $this->number = $number;
    }

	public function getAsArray(){
		return Array(
			"id" => $this->id,
			"name" => $this->name,
            "color" => "#" . $this->color,
            "number" => $this->number
		);
	}

}
