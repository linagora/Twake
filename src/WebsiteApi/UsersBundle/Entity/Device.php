<?php

namespace WebsiteApi\UsersBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * Mail
 *
 * @ORM\Table(name="device",options={"engine":"MyISAM", "scylladb_keys": {{"id": "ASC"}, {"value": "ASC"}, {"user_id":"ASC"}}})
 * @ORM\Entity(repositoryClass="WebsiteApi\UsersBundle\Repository\DeviceRepository")
 */
class Device
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
	 */
    private $user;

	/**
	 * @var string
	 *
     * @ORM\Column(name="type", type="string", length=16)
	 */
	private $type;

	/**
	 * @var string
	 *
     * @ORM\Column(name="version", type="string", length=16)
	 */
	private $version;

    /**
     * @var string
     *
     * @ORM\Column(name="value", type="twake_text", nullable=true)
     * @Encrypted
     */
    private $value = "";

    public function __construct($user, $type, $value, $version)
    {
    	$this->user = $user;
        $this->setType($type);
        $this->setValue($value);
        $this->setVersion($version);
    }

	/**
	 * @return int
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
	 * @return string
	 */
	public function getType()
	{
		return $this->type;
	}

	/**
	 * @param string $type
	 */
	public function setType($type)
	{
        $this->type = isset($type) ? $type : "";
	}

	/**
	 * @return string
	 */
	public function getValue()
	{
		return $this->value;
	}

	/**
	 * @param string $value
	 */
	public function setValue($value)
	{
        $this->value = isset($value) ? $value : "";
	}

	/**
	 * @return string
	 */
	public function getVersion()
	{
		return $this->version;
	}

	/**
	 * @param string $version
	 */
	public function setVersion($version)
	{
        $this->version = isset($version) ? $version : "unknown";
	}

    public function getAsArray()
    {
        return Array(
            "user" => $this->getUser()->getAsArray(),
            "type" => $this->getType(),
            "value" => $this->getValue(),
            "version" => $this->getVersion()

        );
    }


}

