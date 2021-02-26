<?php

namespace Twake\Drive\Services\OldFileSystem;

use App\App;

class DriveAdapterSelector
{

    public function __construct(App $app)
    {
        $services = $app->getServices();
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
        $configuration = $this->storagemanager->getProviderConfiguration($provider);
    
        if ($configuration["type"] === "S3") {
            $this->aws_file_system = $this->app->getServices()->get("app.drive.old.AWS_FileSystem");
            $this->aws_file_system->configure($this->app, $configuration);
            return $this->aws_file_system;
        }
        if ($configuration["type"] === "openstack") {
            $this->openstack_file_system = $this->app->getServices()->get("app.drive.old.OpenStack_FileSystem");
            $this->openstack_file_system->configure($this->app, $configuration);
            return $this->openstack_file_system;
        }

    }

}
