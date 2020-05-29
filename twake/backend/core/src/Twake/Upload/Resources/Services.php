<?php

namespace Twake\Upload\Resources;

use Common\BaseServices;

class Services extends BaseServices
{

    protected $services = [
        "app.images_modifiers" => "ImagesModifiers",
        "app.upload" => "Upload",
//        arguments: ["@app.images_modifiers"]
        "app.uploader" => "Uploader",
//        arguments: ["@app.twake_doctrine", "@app.upload", "@app.images_modifiers"]
        #AWS
        "app.aws_uploader" => "AWS_Uploader",
//        arguments: [%aws%, "@app.twake_doctrine", "@app.upload", "@app.images_modifiers"]
        #OpenStack
        "app.openstack_uploader" => "OpenStack_Uploader",
//        arguments: [%openstack%, "@app.twake_doctrine", "@app.upload", "@app.images_modifiers"]
    ];

}