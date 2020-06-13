<?php
/**
 * Created by PhpStorm.
 * User: romaricmourgues
 * Date: 17/02/2020
 * Time: 14:19
 */

namespace Common\Commands;


use App\App;

class ContainerAwareCommand
{
    /** @var App */
    public $app;

    public function __construct(App $app)
    {
        $this->configure();
        $this->app = $app;
    }

    public function executeFromManager()
    {
        return $this->execute();
    }

    protected function getApp()
    {
        return $this->app;
    }

    protected function getContainer()
    {

    }

    protected function setName()
    {
        return $this;
    }

    protected function setDescription()
    {
        return $this;
    }

    protected function addOption()
    {
        return $this;
    }

    protected function configure()
    {
    }

    protected function execute()
    {
    }

}