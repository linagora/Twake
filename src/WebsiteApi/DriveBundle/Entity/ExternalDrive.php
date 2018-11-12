<?php

namespace WebsiteApi\DriveBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
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
     * @ORM\Column(name="id", type="cassandra_timeuuid")
	 * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
	 */
	private $id;

	/**
	 * @ORM\ManyToOne(targetEntity="WebsiteApi\UsersBundle\Entity\Token")
	 */
	private $externalToken;

    /**
     * @var string
     *
     * @ORM\Column(type="string", length=350)
     */
    private $fileId;


    /**
     * @ORM\ManyToOne(targetEntity="WebsiteApi\WorkspacesBundle\Entity\Workspace")
     */
    private $workspace;

    /**
     * @ORM\Column(type="boolean")
     */
    private $completed;


	public function __construct($fileId, $token, $workspace){
	    $this->setExternalToken($token);
	    $this->setFileId($fileId);
	    $this->setWorkspace($workspace);
	    $this->setCompleted(false);
	}

    /**
     * @return mixed
     */
    public function getExternalToken()
    {
        return $this->externalToken;
    }

    /**
     * @param mixed $externalToken
     */
    public function setExternalToken($externalToken)
    {
        $this->externalToken = $externalToken;
    }

    /**
     * @return string
     */
    public function getFileId()
    {
        return $this->fileId;
    }

    /**
     * @param string $fileId
     */
    public function setFileId($fileId)
    {
        $this->fileId = $fileId;
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
