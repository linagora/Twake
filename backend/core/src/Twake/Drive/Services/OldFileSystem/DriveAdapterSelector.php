<?php

namespace Twake\Drive\Services\OldFileSystem;

class DriveAdapterSelector
{

    public function __construct(App $app)
    {
        $this->aws = $aws;
        $this->openstack = $openstack;
        $this->aws_file_system = $aws_file_system;
        $this->openstack_file_system = $openstack_file_system;
    }

    public function getFileSystem()
    {

        if (isset($this->aws["S3"]["use"]) && $this->aws["S3"]["use"]) {
            return $this->aws_file_system;
        }
        if (isset($this->openstack["use"]) && $this->openstack["use"]) {
            return $this->openstack_file_system;
        }

    }

}
