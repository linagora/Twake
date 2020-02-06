<?php

namespace Configuration;

class Parameters extends \Common\Configuration
{

    public $configuration = [];

    public function __construct()
    {
        $this->configuration = [
            "MAIL_FROM" => "",
            "SERVER_NAME" => "",
            "TWAKE_ADDRESS" => "",
            "LICENCE_KEY" => "",
            "STANDALONE" => true,
            "ELASTIC_SERVER" => "elasticsearch_twake:9200",
            "db" => [
                "driver" => "pdo_cassandra",
                "host" => "scylladb",
                "port" => 9160,
                "dbname" => "Twake",
                "user" => "root",
                "password" => "root",
                "encrypt_key" => "c9a17eab88ab63bb3e90c027196a89776651a7c06651a7c0",
                "dev" => true
            ],
            "twig_parameters" => [],
            "mailer_parameters" => [],
        ];
    }

}