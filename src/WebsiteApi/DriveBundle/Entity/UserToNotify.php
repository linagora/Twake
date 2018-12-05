<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\UsersBundle\Entity\User;

/**
 * UserToNotify
 *
 * @ORM\Table(name="user_to_notify_drive",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\UserToNotifyRepository")
 */
class UserToNotify
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     */
    private $user;

    /**
     * @ORM\Column(type="string", length=512, options={"index":true})
     */
    private $drivefile;


    /**
     * @ORM\Column(type="string", length=512)
     */
    private $drivetype;


    /**
     * @ORM\Column(type="text")
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
            "driveFile" => $this->getDriveFile(),
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
