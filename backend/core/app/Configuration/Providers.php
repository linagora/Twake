<?php

namespace Configuration;

use Common\BaseProviders;

class Providers
{
    public $providers = [
        "swiftmailer" => [
            "services" => [
                "mailer"
            ],
            "register" => "Silex\Provider\SwiftmailerServiceProvider"
        ],
        "doctrine" => [
            "services" => [
                "db"
            ],
            "register" => "Silex\Provider\DoctrineServiceProvider",
        ]
    ];

}