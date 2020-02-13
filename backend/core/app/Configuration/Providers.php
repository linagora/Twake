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
        "twig" => [
            "services" => [
                "twig",
                "twig.loader"
            ],
            "register" => "Silex\Provider\TwigServiceProvider",
        ],
        "doctrine" => [
            "services" => [
                "db"
            ],
            "register" => "Silex\Provider\DoctrineServiceProvider",
        ]
    ];

}