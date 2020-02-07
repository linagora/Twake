<?php

namespace Configuration;

use App\App;
use Twake\Users\Services\UserProvider;

class Configuration extends \Common\Configuration
{

    public $configuration = [];

    public function __construct(App $app)
    {
        $this->configuration = [
            "security" => [
                "security.firewalls" => [
                    "main" => [
                        "users" => function () use ($app) {
                            return new UserProvider($app->getServices()->get("app.twake_doctrine"));
                        },
                    ]
                ]
            ]
        ];
    }

}