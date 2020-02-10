<?php

namespace Twake\Upload;

require_once __DIR__ . "/Resources/Services.php";

use Twake\Upload\Resources\Services;
use Common\BaseBundle;

class Bundle extends BaseBundle
{

    protected $bundle_root = __DIR__;
    protected $bundle_namespace = __NAMESPACE__;
    protected $routes = [];
    protected $services = [];

    public function init()
    {

        $this->services = (new Services())->getServices();
        $this->initServices();
    }
}