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
     * @ORM\Column(name ="workspace_id", type="twake_text")
     */
    protected $workspace_id;

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
     * @ORM\Column(name ="success", type="twake_boolean")
     */
    protected $success;

    /**
     * @ORM\Column(name ="chunklist", type="twake_text", nullable=true)
     */
    protected $chunklist;

    /**
     * @ORM\Column(name ="has_preview", type="twake_boolean")
     */
    protected $has_preview;

    /**
     * @ORM\Column(name ="encryption_key", type="twake_text", nullable=true)
     */
    protected $encryption_key;

    public function __construct($workspace_id, $identifier, $filename, $extension, $chunklist)
    {
        $this->workspace_id = $workspace_id;
        $this->identifier = $identifier;
        $this->filename = $filename;
        $this->extension = $extension;
        $this->chunk = 1;
        $this->chunklist = json_encode($chunklist);
        $this->success = false;
        $this->encryption_key = "testkey";
    }

    /**
     * @return mixed
     */
    public function getChunklist()
    {
        return json_decode($this->chunklist);
    }

    /**
     * @param mixed $chunklist
     */
    public function setChunklist($chunklist)
    {
        $this->chunklist = json_encode($chunklist);
    }

    public function addChunk($chunk){

        $chunklist = $this->getChunklist();
        array_push($chunklist ,$chunk);
        $this->setChunklist($chunklist);
        //error_log(print_r($this->chunklist,true));

        $this->setChunk(count($this->getChunklist()));
    }

    public function getAsArray()
    {
        $return = Array(
            "id" => $this->getId(),
            "filename" => $this->getFilename(),
            "identifier" => $this->getIdentifier(),
            "extension" => $this->getExtension(),
            "chunk" => $this->getChunk(),
            "chunklist" => $this->getChunklist(),
            "succes" => $this->getSuccess()
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
     * @return mixed
     */
    public function getEncryptionKey()
    {
        return $this->encryption_key;
    }

    /**
     * @param mixed $encryption_key
     */
    public function setEncryptionKey($encryption_key)
    {
        $this->encryption_key = $encryption_key;
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
    public function getSuccess()
    {
        return $this->success;
    }

    /**
     * @param mixed $success
     */
    public function setSuccess($success)
    {
        $this->success = $success;
    }

    /**
     * @return mixed
     */
    public function getWorkspaceId()
    {
        return $this->workspace_id;
    }

    /**
     * @param mixed $workspace_id
     */
    public function setWorkspaceId($workspace_id)
    {
        $this->workspace_id = $workspace_id;
    }

    /**
     * @return mixed
     */
    public function getHasPreview()
    {
        return $this->has_preview;
    }

    /**
     * @param mixed $has_preview
     */
    public function setHasPreview($has_preview)
    {
        $this->has_preview = $has_preview;
    }

}