<?php

namespace WebsiteApi\OnlyOfficeBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
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
     * @ORM\Column(name="versionkey", type="string", length=512)
     */
    private $key;

    /**
     * @ORM\Column(name="name", type="text")
     */
    private $name;


    public function __construct($workspaceId, $fileId)
    {
        $this->fileId = $fileId;
        $this->workspaceId = $workspaceId;
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
    public function getGroupId()
    {
        return $this->workspaceId;
    }

    /**
     * @return mixed
     */
    public function getFileId()
    {
        return $this->fileId;
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
