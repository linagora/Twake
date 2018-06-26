<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * UserToNotify
 *
 * @ORM\Table(name="user_to_notify_drive",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\UserToNotifyRepository")
 */
class UserToNotify
{
    /**
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\User")
     */
    private $user;

    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\DriveBundle\Entity\DriveFile")
     */
    private $driveFile;

    public function __construct($user, $driveFile)
    {
        $this->setUser($user);
        $this->setDriveFile($driveFile);
    }

    public function getAsArray()
    {
        return Array(
            "id" => $this->getId(),
            "user" => $this->getUser(),
            "driveFile" => $this->getDriveFile()->getAsArray()
        );
    }

    /**
     * @return mixed
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
        $this->driveFile = $driveFile;
    }

}
