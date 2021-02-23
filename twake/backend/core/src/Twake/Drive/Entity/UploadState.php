<?php


namespace Twake\Drive\Entity;

use Doctrine\ORM\Mapping as ORM;


/**
 * UploadState
 *
 * @ORM\Table(name="uploadstate",options={"engine":"MyISAM", "scylladb_keys": {{"id": "ASC"}, {"identifier": "ASC"}} })
 * @ORM\Entity()
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
     * @ORM\Column(name ="identifier", type="twake_no_salt_text")
     */
    protected $identifier;

    /**
     * @ORM\Column(name ="user_id", type="twake_no_salt_text")
     */
    protected $user_id;

    /**
     * @ORM\Column(name ="workspace_id", type="twake_no_salt_text")
     */
    protected $workspace_id;

    /**
     * @ORM\Column(name ="filename", type="twake_text")
     */
    protected $filename;

    /**
     * @ORM\Column(name ="extension", type="twake_no_salt_text")
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

    /**
     * @ORM\Column(name ="encryption_mode", type="twake_text", nullable=true)
     */
    protected $encryption_mode;

    /**
     * @ORM\Column(name ="encryption_salt", type="twake_text", nullable=true)
     */
    protected $encryption_salt;

    /**
     * @ORM\Column(name ="storage_provider", type="string", nullable=true)
     */
    protected $storage_provider;

    public function __construct($storage_provider, $workspace_id, $identifier, $filename, $extension, $chunklist)
    {
        $this->workspace_id = $workspace_id;
        $this->identifier = $identifier;
        $this->filename = $filename;
        $this->extension = $extension;
        $this->chunk = 1;
        $this->chunklist = json_encode($chunklist);
        $this->success = false;
        $this->encryption_key = "testkey";
        $this->storage_provider = $storage_provider;
    }

    /**
     * @return mixed
     */
    public function getStorageProvider()
    {
        return $this->storage_provider;
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

    public function addChunk($chunk)
    {

        $chunklist = $this->getChunklist();
        array_push($chunklist, $chunk);
        $this->setChunklist($chunklist);

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
     * @return mixed
     */
    public function getEncryptionMode()
    {
        return $this->encryption_mode;
    }

    /**
     * @param mixed $encryption_mode
     */
    public function setEncryptionMode($encryption_mode): void
    {
        $this->encryption_mode = $encryption_mode;
    }

    /**
     * @return mixed
     */
    public function getEncryptionSalt()
    {
        return $this->encryption_salt;
    }

    /**
     * @param mixed $encryption_salt
     */
    public function setEncryptionSalt($encryption_salt): void
    {
        $this->encryption_salt = $encryption_salt;
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

    /**
     * @return mixed
     */
    public function getUserId()
    {
        return $this->user_id;
    }

    /**
     * @param mixed $user_id
     */
    public function setUserId($user_id)
    {
        $this->user_id = $user_id;
    }

}