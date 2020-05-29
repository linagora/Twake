<?php

namespace Configuration;

class Providers
{
    public $providers = [
        "doctrine" => [
            "services" => [
                "db"
            ],
            "register" => "Twake\Core\Services\DoctrineAdapter\DoctrineServiceProvider",
        ]
    ];

}