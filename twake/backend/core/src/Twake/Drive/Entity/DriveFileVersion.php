<?php

namespace Twake\Drive\Entity;

use Doctrine\ORM\Mapping as ORM;


use Twake\Users\Entity\User;

/**
 * DriveFileVersion
 *
 * @ORM\Table(name="drive_file_version",options={"engine":"MyISAM" , "scylladb_keys": { {"id": "DESC"}, {"file_id": "DESC"} } })
 * @ORM\Entity()
 */
class DriveFileVersion
{
    /**
     * @ORM\Column(name="id", type="twake_timeuuid")
     * @ORM\Id
     */
    private $id;

    /**
     * @ORM\Column(name="file_id", type="twake_timeuuid")
     */
    private $file_id;

    /**
     * @ORM\Column(name="creator_id", type="twake_no_salt_text")
     */
    private $creator_id;

    /**
     * @ORM\Column(type="twake_no_salt_text")
     */
    private $realname;

    /**
     * @ORM\Column(name="aes_key", type="twake_text")
     */
    private $key;

    /**
     * @ORM\Column(type="twake_no_salt_text")
     */
    private $mode = "OpenSSL-2";

    /**
     * @ORM\Column(type="integer")
     */
    private $size;

    /**
     * @ORM\Column(type="twake_bigint")
     */
    private $file_size;

    /**
     * @ORM\Column(type="twake_datetime")
     */
    private $date_added;

    /**
     * @ORM\Column(type="twake_text")
     */
    private $filename;

    /**
     * @ORM\Column(type="twake_text")
     */
    private $data;

    /**
     * @ORM\Column(name="provider", type="string")
     */
    private $provider;

    public function __construct(DriveFile $file, $user_id)
    {
        $this->file_id = $file->getId();
        $this->setKey(base64_encode(random_bytes(256)));
        $this->setSize(0);
        $this->resetRealName();
        $this->date_added = new \DateTime();
        $this->setFileName($file->getName());
        $this->setUserId($user_id);
    }

    /**
     * @return mixed
     */
    public function getData()
    {
        return json_decode($this->data, true);
    }

    /**
     * @param mixed $data
     */
    public function setData($data)
    {
        $this->data = json_encode($data);
    }

    /**
     * @return mixed
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    public function getId()
    {
        return $this->id;
    }

    public function setProvider($provider)
    {
        $this->provider = $provider;
    }

    public function getProvider()
    {
        return $this->provider;
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
    public function setKey($key)
    {
        $this->key = $key;
    }

    /**
     * @return mixed
     */
    public function getRealName()
    {
        return $this->realname;
    }

    /**
     * @param mixed $realname
     */
    public function resetRealName()
    {
        $this->realname = sha1(microtime() . rand(0, 10000)) . ".tw";
    }

    /**
     * @return mixed
     */
    public function getSize()
    {
        return $this->file_size ?: $this->size; //Size is the old 32bit integer...
    }

    /**
     * @param mixed $size
     */
    public function setSize($size)
    {
        $this->file_size = $size;
    }

    /**
     * @return mixed
     */
    public function getMode()
    {
        if (!$this->mode) {
            return "AES";
        }
        return $this->mode;
    }

    public function setMode($mode)
    {
        $this->mode = $mode;
    }

    public function getAsArray()
    {
        return Array(
            "id" => $this->id,
            "name" => $this->getFileName(),
            "file_id" => $this->getFileId(),
            "added" => $this->date_added->getTimestamp(),
            "size" => $this->getSize(),
            //"user" => $this->user!=null ? $this->user->getId() != 0 ? $this->user->getAsArray() : "" : "",
            "creator" => $this->getUserId(),
            "data" => $this->getData()
        );
    }

    /**
     * @return mixed
     */
    public function getFileName()
    {
        return $this->filename;
    }

    /**
     * @param mixed $filename
     */
    public function setFileName($filename)
    {
        $this->filename = $filename;
    }

    /**
     * @return mixed
     */
    public function getUserId()
    {
        return $this->creator_id;
    }

    /**
     * @param mixed $user
     */
    public function setUserId($user)
    {
        $this->creator_id = $user;
    }

    /**
     * @return mixed
     */
    public function getDateAdded()
    {
        return $this->date_added;
    }

    /**
     * @param mixed $date_added
     */
    public function setDateAdded($date_added)
    {
        $this->date_added = $date_added;
    }

    /**
     * @return mixed
     */
    public function getFileId()
    {
        return $this->file_id;
    }

    /**
     * @param mixed $file_id
     */
    public function setFileId($file_id)
    {
        $this->file_id = $file_id;
    }


}
