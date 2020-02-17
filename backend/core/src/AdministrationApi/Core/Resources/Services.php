<?php

namespace AdministrationApi\Core\Resources;

use Common\BaseServices;

class Services extends BaseServices
{
    protected $services = [
        "administration.validation" => "ValidationService",
//    arguments: [ %administration_token% ]
    ];

}