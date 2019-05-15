<?php


namespace WebsiteApi\DriveUploadBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Reprovinci\DoctrineEncrypt\Configuration\Encrypted;

/**
 * UploadState
 *
 * @ORM\Table(name="uploadstate",options={"engine":"MyISAM", "scylladb_keys": {{"filename": "ASC", "id": "DESC"}, {"identifier": "ASC"}, {"id": "ASC"}} })
 * @ORM\Entity(repositoryClass="WebsiteApi\DriveUploadBundle\Repository\UploadStateRepository")
 */


class UploadState
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    protected $id;

    /**
     * @ORM\Column(name ="identifier", type="twake_text")
     */
    protected $identifier;

    /**
     * @ORM\Column(name ="filename", type="twake_text")
     * @ORM\Id
     */
    protected $filename;

    /**
     * @ORM\Column(name ="extension", type="twake_text")
     */
    protected $extension;

    /**
     * @ORM\Column(name ="chunk", type="integer")
     */
    protected $chunk;

    /**
     * @ORM\Column(name ="succes", type="twake_boolean")
     */
    protected $succes;

    public function __construct($identifier, $filename, $extension)
    {
        $this->identifier = $identifier;
        $this->filename = $filename;
        $this->extension = $extension;
        $this->chunk = 1;
        $this->succes = false;

    }

    public function getAsArray()
    {
        $return = Array(
            "id" => $this->getId(),
            "filename" => $this->getFilename(),
            "identifier" => $this->getIdentifier(),
            "extension" => $this->getExtension(),
            "chunk" => $this->getChunk(),
            "succes" => $this->getSucces()
        );
        return $return;
    }

    /**
     * @return mixed
     */
    public function getChunk()
    {
        return $this->chunk;
    }

    /**
     * @param mixed $chunk
     */
    public function setChunk($chunk)
    {
        $this->chunk = $chunk;
    }


    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param int $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return mixed
     */
    public function getIdentifier()
    {
        return $this->identifier;
    }

    /**
     * @param mixed $identifier
     */
    public function setIdentifier($identifier)
    {
        $this->identifier = $identifier;
    }

    /**
     * @return mixed
     */
    public function getFilename()
    {
        return $this->filename;
    }

    /**
     * @param mixed $filename
     */
    public function setFilename($filename)
    {
        $this->filename = $filename;
    }

    /**
     * @return mixed
     */
    public function getExtension()
    {
        return $this->extension;
    }

    /**
     * @param mixed $extension
     */
    public function setExtension($extension)
    {
        $this->extension = $extension;
    }

    /**
     * @return mixed
     */
    public function getSucces()
    {
        return $this->succes;
    }

    /**
     * @param mixed $succes
     */
    public function setSucces($succes)
    {
        $this->succes = $succes;
    }



}