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
            "parameters" => "twig_parameters",
        ],
        "doctrine" => [
            "services" => [
                "db"
            ],
            "register" => "Silex\Provider\DoctrineServiceProvider",
            "parameters" => "db_parameters",
        ],
    ];

}