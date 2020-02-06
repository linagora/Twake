<?php

namespace Configuration;

class Parameters extends \Common\Configuration
{

    public $configuration = [];

    public function __construct()
    {
        $configuration = [
            "MAIL_FROM" => "",
            "SERVER_NAME" => "",
            "TWAKE_ADDRESS" => "",
            "LICENCE_KEY" => "",
            "STANDALONE" => true,
            "twig_parameters" => [],
            "mailer_parameters" => [],
        ];
    }

}