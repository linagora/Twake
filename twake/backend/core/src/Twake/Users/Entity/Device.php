<?php

namespace Twake\Users\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * Mail
 *
 * @ORM\Table(name="device",options={"engine":"MyISAM", "scylladb_keys": {{"id": "ASC"}, {"value": "ASC"}, {"user_id":"ASC"}}})
 * @ORM\Entity()
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
     * @ORM\Column(name="user_id", type="twake_timeuuid")
     */
    private $user_id;

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
     * @ORM\Column(name="value", type="twake_no_salt_text", nullable=true)
     */
    private $value = "";

    public function __construct($user_id, $type, $value, $version)
    {
        $this->user_id = $user_id;
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
    public function getUserId()
    {
        return $this->user_id;
    }

    /**
     * @param mixed $user
     */
    public function setUserId($user_id)
    {
        $this->user_id = $user_id;
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
            "user_id" => $this->getUserId(),
            "type" => $this->getType(),
            "value" => $this->getValue(),
            "version" => $this->getVersion()

        );
    }


}

