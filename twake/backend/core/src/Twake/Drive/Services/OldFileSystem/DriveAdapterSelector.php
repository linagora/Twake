<?php

namespace Twake\Drive\Services\OldFileSystem;

use App\App;

class DriveAdapterSelector
{

    public function __construct(App $app)
    {
        $services = $this->getApp()->getServices();
        $this->app = $app;
        $this->aws = $app->getContainer()->getParameter("storage.S3");
        $this->openstack = $app->getContainer()->getParameter("storage.openstack");
        $this->storagemanager = $services->get("driveupload.storemanager");
    }

    public function getFileSystem($provider = null)
    {
        if(!$provider){
            $provider = $this->storagemanager->getOneProvider();
        }
        //TODO use $provider
    
        if (isset($this->aws["use"]) && $this->aws["use"]) {
            $this->aws_file_system = $this->app->getServices()->get("app.drive.old.AWS_FileSystem");
            return $this->aws_file_system;
        }
        if (isset($this->openstack["use"]) && $this->openstack["use"]) {
            $this->openstack_file_system = $this->app->getServices()->get("app.drive.old.OpenStack_FileSystem");
            return $this->openstack_file_system;
        }

    }

}
