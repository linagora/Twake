<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
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
     * @ORM\Column(name="id", type="cassandra_timeuuid")
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
    private $driveFile;


    /**
     * @ORM\Column(type="string", length=512)
     */
    private $driveType;


    /**
     * @ORM\Column(type="text")
     */
    private $additionalData;


    public function __construct($user, $driveFile, $driveType, $additionalData=Array())
    {
        $this->setUser($user);
        $this->setDriveFile($driveFile);
        $this->setDriveType($driveType);
        $this->setAdditionalData($additionalData);
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
        return $this->driveFile;
    }

    /**
     * @param mixed $driveFile
     */
    public function setDriveFile($driveFile)
    {
        $this->driveFile = strval($driveFile);
    }

    /**
     * @return mixed
     */
    public function getDriveType()
    {
        return $this->driveType;
    }

    /**
     * @param mixed $driveType
     */
    public function setDriveType($driveType)
    {
        $this->driveType = $driveType;
    }

    /**
     * @return mixed
     */
    public function getAdditionalData()
    {
        return json_decode($this->additionalData, true);
    }

    /**
     * @param mixed $additionalData
     */
    public function setAdditionalData($additionalData)
    {
        $this->additionalData = json_encode($additionalData);
    }

}
