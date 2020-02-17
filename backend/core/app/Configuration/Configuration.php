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
            "twig" => [
                'cache' => '/cache/twig'
            ]
        ];
    }

}