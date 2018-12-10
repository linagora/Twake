<?php

namespace WebsiteApi\OnlyOfficeBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * OnlyofficeFile
 *
 * @ORM\Table(name="onlyofficefilekeys",options={"engine":"MyISAM"})
 * @ORM\Entity(repositoryClass="WebsiteApi\OnlyOfficeBundle\Repository\OnlyofficeFileKeysRepository")
 */
class OnlyofficeFileKeys
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="CUSTOM")
     * @ORM\CustomIdGenerator(class="Ramsey\Uuid\Doctrine\UuidOrderedTimeGenerator")
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
     * @ORM\Column(name="versionkey", type="string", length=512)
     */
    private $key;

    /**
     * @ORM\Column(name="name", type="twake_text")
     * @Encrypted
     */
    private $name;


    public function __construct($workspaceid, $fileid)
    {
        $this->fileid = $fileid;
        $this->workspaceid = $workspaceid;
        $this->newKey();
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
     * @return mixed
     */
    public function getFileId()
    {
        return $this->fileid;
    }

    /**
     * @return mixed
     */
    public function getKey()
    {
        return $this->key;
    }

    /**
     * @param mixed $key
     */
    public function newKey()
    {
        $this->key = bin2hex(random_bytes(10));
    }

    /**
     * @return mixed
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param mixed $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }


}
