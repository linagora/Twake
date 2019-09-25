<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\UsersBundle\Entity\User;

/**
 * UserToNotify
 *
 * @ORM\Table(name="user_to_notify_drive",options={"engine":"MyISAM", "scylladb_keys": {{ "id": "ASC", "user_id":"ASC" }, { "user_id": "ASC" }, { "drivefile": "ASC" }} })
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\UserToNotifyRepository")
 */
class UserToNotify
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     */
    private $user;

    /**
     * @ORM\Column(name="drivefile", type="string", length=512)
     */
    private $drivefile;


    /**
     * @ORM\Column(type="string", length=512)
     */
    private $drivetype;


    /**
     * @ORM\Column(type="twake_text")
     */
    private $additionaldata;


    public function __construct($user, $drivefile, $drivetype, $additionalData = Array())
    {
        $this->setUser($user);
        $this->setDriveFile($drivefile);
        $this->setDriveType($drivetype);
        $this->setAdditionalData($additionaldata);
    }

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "user" => $this->getUser(),
            "drivefile" => $this->getDriveFile(),
            "driveType" => $this->getDriveType(),
            "additionalData" => $this->getAdditionalData()
        );
    }

    /**
     * @return User
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * @param mixed $users
     */
    public function setUser($user)
    {
        $this->user = $user;
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
    public function getDriveFile()
    {
        return $this->drivefile;
    }

    /**
     * @param mixed $drivefile
     */
    public function setDriveFile($drivefile)
    {
        $this->drivefile = strval($drivefile);
    }

    /**
     * @return mixed
     */
    public function getDriveType()
    {
        return $this->drivetype;
    }

    /**
     * @param mixed $drivetype
     */
    public function setDriveType($drivetype)
    {
        $this->drivetype = $drivetype;
    }

    /**
     * @return mixed
     */
    public function getAdditionalData()
    {
        return json_decode($this->additionaldata, true);
    }

    /**
     * @param mixed $additionaldata
     */
    public function setAdditionalData($additionaldata)
    {
        $this->additionaldata = json_encode($additionaldata);
    }

}
