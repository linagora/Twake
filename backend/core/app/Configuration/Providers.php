<?php

namespace Configuration;

class Providers
{
    public $providers = [
        "doctrine" => [
            "services" => [
                "db"
            ],
            "register" => "Silex\Provider\DoctrineServiceProvider",
        ]
    ];

}