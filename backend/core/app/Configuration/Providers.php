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
            "register" => "Silex\Provider\SwiftmailerServiceProvider",
            "parameters" => "mailer_parameters",
        ],
        "twig" => [
            "services" => [
                "twig"
            ],
            "register" => "Silex\Provider\TwigServiceProvider",
        ],
        "doctrine" => [
            "services" => [
                "db"
            ],
            "register" => "Silex\Provider\DoctrineServiceProvider",
        ],
        "security" => [
            "services" => [
                "security.token_storage",
                "security.authorization_checker",
                "security.encoder_factory"
            ],
            "register" => "Silex\Provider\SecurityServiceProvider",
        ],
    ];

}