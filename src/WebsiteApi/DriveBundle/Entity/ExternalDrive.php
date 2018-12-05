<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * ExternalDrive
 *
 * @ORM\Table(name="external_drive",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveBundle\Repository\ExternalDriveRepository")
 */
class ExternalDrive
{

	/**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
	 */
	private $id;

	/**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\Token")
	 */
    private $externaltoken;

    /**
     * @var string
     *
     * @ORM\Column(type="string", length=350)
     */
    private $fileid;


    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
     */
    private $workspace;

    /**
     * @ORM\Column(type="twake_boolean")
     */
    private $completed;


    public function __construct($fileid, $token, $workspace)
    {
	    $this->setExternalToken($token);
        $this->setFileId($fileid);
	    $this->setWorkspace($workspace);
	    $this->setCompleted(false);
	}

    /**
     * @return mixed
     */
    public function getExternalToken()
    {
        return $this->externaltoken;
    }

    /**
     * @param mixed $externaltoken
     */
    public function setExternalToken($externaltoken)
    {
        $this->externaltoken = $externaltoken;
    }

    /**
     * @return string
     */
    public function getFileId()
    {
        return $this->fileid;
    }

    /**
     * @param string $fileid
     */
    public function setFileId($fileid)
    {
        $this->fileid = $fileid;
    }

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param mixed $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getWorkspace()
    {
        return $this->workspace;
    }

    /**
     * @param mixed $workspace
     */
    public function setWorkspace($workspace)
    {
        $this->workspace = $workspace;
    }

    /**
     * @return mixed
     */
    public function getCompleted()
    {
        return $this->completed;
    }

    /**
     * @param mixed $completed
     */
    public function setCompleted($completed)
    {
        $this->completed = $completed;
    }
}
