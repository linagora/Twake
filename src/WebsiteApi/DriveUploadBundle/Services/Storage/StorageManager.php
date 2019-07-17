<?php

namespace WebsiteApi\DriveUploadBundle\Services\Storage;

use WebsiteApi\DriveUploadBundle\Services\Storage\Adapter_AWS;
use WebsiteApi\DriveUploadBundle\Services\Storage\Adapter_OpenStack;

class StorageManager{

    private $aws;
    private $openstack;
    private $root;
    private $adapter;

    public function __construct($aws, $openstack, $root)
    {
        $this->aws = $aws;
        $this->openstack = $openstack;
        $this->root = $root;
    }

    public function BindAdapter(){

        if (isset($this->aws["S3"]["use"]) && $this->aws["S3"]["use"]) {
            return new Adapter_AWS($this->aws);
        }
        elseif (isset($this->openstack["use"]) && $this->openstack["use"]) {
            return new Adapter_OpenStack($this->openstack);
        }

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

    /**
     * @return mixed
     */
    public function getAdapter()
    {
        if (!$this->adapter) {
            $this->adapter = $this->BindAdapter();
        }
        return $this->adapter;
    }

    /**
     * @param mixed $adapter
     */
    public function setAdapter($adapter)
    {
        $this->adapter = $adapter;
    }



}