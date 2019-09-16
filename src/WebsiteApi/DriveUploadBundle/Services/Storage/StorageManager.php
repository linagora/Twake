<?php

namespace WebsiteApi\DriveUploadBundle\Services\Storage;

use WebsiteApi\DriveUploadBundle\Services\Storage\Adapter_AWS;
use WebsiteApi\DriveUploadBundle\Services\Storage\Adapter_OpenStack;

class StorageManager{

    private $aws;
    private $openstack;
    private $root;
    private $adapter;
    private $doctrine;

    public function __construct($aws, $openstack, $root, $preview,$doctrine)
    {
        $this->aws = $aws;
        $this->openstack = $openstack;
        $this->root = $root;
        $this->preview = $preview;
        $this->doctrine = $doctrine;
    }

    public function BindAdapter(){

        if (isset($this->aws["S3"]["use"]) && $this->aws["S3"]["use"]) {
            return new Adapter_AWS($this->aws, $this->preview, $this->doctrine);
        }
        elseif (isset($this->openstack["use"]) && $this->openstack["use"]) {
            return new Adapter_OpenStack($this->openstack, $this->preview, $this->doctrine);
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