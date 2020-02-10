<?php

namespace Configuration;

class Parameters extends \Common\Configuration
{

    public $configuration = [];

    public function __construct()
    {
        $this->configuration = [
            "admin_api_token" => "",
            "MAIL_FROM" => "",
            "SERVER_NAME" => "",
            "TWAKE_ADDRESS" => "",
            "LICENCE_KEY" => "",
            "STANDALONE" => true,
            "ELASTIC_SERVER" => "elasticsearch_twake:9200",
            "DRIVE_SALT" => "SecretPassword",
            "drive_previews_tmp_folder" => "/tmp/",
            "drive_tmp_folder" => "/tmp/",
            "secret" => "somesecret",
            "websocket" => [
                "host" => "websockets",
                "port" => "8080"
            ],
            "db" => [
                "driver" => "pdo_cassandra",
                "host" => "scylladb",
                "port" => 9160,
                "dbname" => "Twake",
                "user" => "root",
                "password" => "root",
                "encryption_key" => "c9a17eab88ab63bb3e90c027196a89776651a7c06651a7c0",
                "dev" => true
            ],
            "openstack" => [
                "use" => false,
                "project_id" => "fb6655d359e14e77aa2fa382af8bd6e7",
                "auth_url" => "https//auth.cloud.ovh.net/v2.0",
                "buckets_prefix" => "",
                "buckets" => [
                    "fr" => [
                        "public" => "twake_openstack_test",
                        "private" => "openstack_private_test",
                        "region" => "SBG5"
                    ],
                    "user" => [
                        "id" => "4MdhXCSddEPF",
                        "password" => "NMebu3Um95C6ujQ7J64zDAzzy3ubKhpe"
                    ]
                ],
            ],
            "aws" => [
                "S3" => [
                    "base_url" => "http//127.0.0.1:9000",
                    "use" => false,
                    "version" => "latest",
                    "buckets_prefix" => "dev.",
                    "buckets" => [
                        "fr" => "eu-west-3"
                    ],
                    "credentials" => [
                        "key" => "AKIAIMIQU7K2R7QM7MAQ",
                        "secret" => " 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"
                    ]
                ],
            ],
            "local" => [
                "storage" => [
                    "use" => true,
                    "location" => "../drive/",
                    "preview_location" => "../web/medias/",
                    "preview_public_path" => "/medias/"
                ]
            ],
            "twig_parameters" => [],
            "mailer_parameters" => [],
        ];
    }

}