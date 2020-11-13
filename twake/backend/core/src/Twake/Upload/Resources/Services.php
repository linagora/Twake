<?php

namespace Twake\Upload\Resources;

use Common\BaseServices;

class Services extends BaseServices
{

    protected $services = [
        "app.images_modifiers" => "ImagesModifiers",
        "app.upload" => "Upload",
        "app.uploader" => "Uploader",
        #AWS
        "app.aws_uploader" => "AWS_Uploader",
        #OpenStack
        "app.openstack_uploader" => "OpenStack_Uploader",
    ];

}