<?php

namespace WebsiteApi\DriveUploadBundle\Services\Storage;

class EncryptionBag{

    private $path;
    private $key;
    private $mode;

    public function __construct($path, $key, $mode)
    {
        $this->path = $path;
        $this->key = $key;
        $this->mode = $mode;
    }

    /**
     * @return mixed
     */
    public function getPath()
    {
        return $this->path;
    }

    /**
     * @param mixed $path
     */
    public function setPath($path)
    {
        $this->path = $path;
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
    public function getMode()
    {
        return $this->mode;
    }

    /**
     * @param mixed $mode
     */
    public function setMode($mode)
    {
        $this->mode = $mode;
    }



}