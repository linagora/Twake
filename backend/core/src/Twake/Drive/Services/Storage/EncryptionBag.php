<?php

namespace Twake\Drive\Services\Storage;

class EncryptionBag
{

    private $salt;
    private $key;
    private $mode;

    public function __construct($key, $salt = "", $mode = "OpenSSL-2")
    {
        $this->salt = $salt;
        $this->key = $key;
        $this->mode = $mode;
    }

    /**
     * @return mixed
     */
    public function getSalt()
    {
        return $this->salt;
    }

    /**
     * @param mixed $salt
     */
    public function setSalt($salt)
    {
        $this->salt = $salt;
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