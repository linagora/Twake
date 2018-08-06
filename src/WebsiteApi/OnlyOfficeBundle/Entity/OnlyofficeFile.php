<?php

namespace WebsiteApi\OnlyOfficeBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * OnlyofficeFile
 *
 * @ORM\Table(name="onlyofficefile",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\OnlyOfficeBundle\Repository\OnlyofficeFileRepository")
 */
class OnlyofficeFile
{
    /**
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column(name="group_id", type="integer")
     */
    private $workspaceId;

    /**
     * @ORM\Column(name="file_id", type="integer")
     */
    private $fileId;
    /**
     * @ORM\Column(name="date", type="datetime")
     */
    private $date;

    /**
     * @ORM\Column(name="token", type="string", length=256)
     */
    private $token;


    public function __construct($workspaceId, $fileId)
    {
        $this->fileId = $fileId;
        $this->workspaceId = $workspaceId;
        $this->token = base64_encode(bin2hex(random_bytes(20)));
        $this->resetDate();
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
    public function getGroupId()
    {
        return $this->workspaceId;
    }

    /**
     * @param mixed $workspaceId
     */
    public function setGroupId($workspaceId)
    {
        $this->workspaceId = $workspaceId;
    }

    /**
     * @return mixed
     */
    public function getFileId()
    {
        return $this->fileId;
    }

    /**
     * @param mixed $fileId
     */
    public function setFileId($fileId)
    {
        $this->fileId = $fileId;
    }

    /**
     * @return mixed
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * @return mixed
     */
    public function resetDate()
    {
        $this->date = new \DateTime();
    }

    /**
     * @return mixed
     */
    public function getToken()
    {
        return $this->token;
    }


}
