<?php

namespace Twake\Drive\Services\Storage;

use App\App;

class StorageManager
{

    private $aws;
    private $openstack;
    private $root;
    private $adapter;
    private $doctrine;

    public function __construct(App $app)
    {
        $this->aws = $app->getContainer()->getParameter("aws");
        $this->openstack = $app->getContainer()->getParameter("openstack");
        $this->local = $app->getContainer()->getParameter("local");
        $this->root = $this->local = $app->getAppRootDir();
        $this->preview = $app->getServices->get("app.drive.preview");
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
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

    public function BindAdapter()
    {

        if (isset($this->aws["S3"]["use"]) && $this->aws["S3"]["use"]) {
            return new Adapter_AWS($this->aws, $this->preview, $this->doctrine);
        } elseif (isset($this->openstack["use"]) && $this->openstack["use"]) {
            return new Adapter_OpenStack($this->openstack, $this->preview, $this->doctrine);
        }
        return new Adapter_Local($this->local, $this->preview, $this->doctrine);

    }


}