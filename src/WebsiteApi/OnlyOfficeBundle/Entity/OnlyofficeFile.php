<?php

namespace WebsiteApi\OnlyOfficeBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Ambta\DoctrineEncryptBundle\Configuration\Encrypted;
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
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="UUID")
     */
    private $id;

    /**
     * @ORM\Column(name="workspace_id", type="integer")
     */
    private $workspaceid;

    /**
     * @ORM\Column(name="file_id", type="integer")
     */
    private $fileid;

    /**
     * @ORM\Column(name="date", type="twake_datetime")
     */
    private $date;

    /**
     * @ORM\Column(name="token_column", type="string", length=256)
     */
    private $token;


    public function __construct($workspaceid, $fileid)
    {
        $this->fileid = $fileid;
        $this->workspaceid = $workspaceid;
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
    public function getWorkspaceId()
    {
        return $this->workspaceid;
    }

    /**
     * @param mixed $workspaceid
     */
    public function setWorkspaceId($workspaceid)
    {
        $this->workspaceid = $workspaceid;
    }

    /**
     * @return mixed
     */
    public function getFileId()
    {
        return $this->fileid;
    }

    /**
     * @param mixed $fileid
     */
    public function setFileId($fileid)
    {
        $this->fileid = $fileid;
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
