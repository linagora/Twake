<?php

namespace Twake\Drive\Services\Storage;

use App\App;

class StorageManager
{

    private $storage;
    private $root;
    private $doctrine;

    public function __construct(App $app)
    {
        $this->storage = $app->getContainer()->getParameter("storage");
        $this->root = $app->getAppRootDir();
        $this->preview = $app->getServices()->get("app.drive.preview");
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
	    $this->app = $app;
    }

    /**
     * @return mixed
     */
    public function getAdapter($provider = false)
    {
        //Prod retro-compatibility
        if($this->getProviderConfiguration("")["label"] === ""){
            $provider = $provider ?: "";
        }

        $configuration = $this->getProviderConfiguration($provider);
	    $configuration["default_drive_salt"] = $this->app->getContainer()->getParameter("storage.drive_salt");

        if ($configuration["type"] === "S3") {
            return new Adapter_AWS($configuration, $this->preview, $this->doctrine);
        } elseif ($configuration["type"] === "openstack") {
            return new Adapter_OpenStack($configuration, $this->preview, $this->doctrine);
        }
        return new Adapter_Local($configuration, $this->preview, $this->doctrine);
    }

    public function getProviderConfiguration($provider = false){
        $defaultProvider = $this->getOneProvider();
        $provider = $provider === false ? $defaultProvider : $provider;
        $configuration = "";
        foreach($this->storage["providers"] as $providerConfiguration){
            if((!$configuration && $providerConfiguration["label"] == $defaultProvider)
                || ($providerConfiguration["label"] == $provider)){
                $configuration = $providerConfiguration;
            }
        }
        return $configuration;
    }

    /**
     * Choose a provider in the available providers
     */
    public function getOneProvider(){
        $candidates = [];

        foreach($this->storage["providers"] as $provider){
            if($provider["use"]){
                $candidates[] = $provider["label"];
            }
        }

        shuffle($candidates);

        return $candidates[0] ?: null;
    }

}