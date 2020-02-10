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
            "LICENCE_KEY" => "",
            "STANDALONE" => true,
            "ELASTIC_SERVER" => "elasticsearch_twake:9200",
            "DRIVE_SALT" => "SecretPassword",
            "server_name" => "http://localhost:8080/",
            "drive_previews_tmp_folder" => "/tmp/",
            "drive_tmp_folder" => "/tmp/",
            "secret" => "somesecret",
            "mail" => [
                "sender" => [
                    "host" => "smtp.serveurmail.net",
                    "port" => "5025",
                    "username" => "noreply@twakeapp.com",
                    "password" => "TwakeNoReply54$",
                    "auth_mode" => "plain"
                ],
                "template_dir" => "/src/Twake/Core/Resources/views/",
                "twake_domain_url" => "https://twakeapp.com/",
                "from" => "noreply@twakeapp.com",
                "from_name" => "Twake",
                "twake_address" => "Twake, 54000 Nancy, France",
                "dkim" => [
                    "private_key" => "-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQCst5XO6IcnC/KTyRLgL83HqTLew6/ozMw6IRpS9KvLytg0E8fz
CNCE4JaN8N5kD6u9b8DZs2EkS6kGnJCDwBBuNFjIVLSZpQbyMnTZ19nBZRtUXsiw
X3GoQX6RbQqe3ToKUxBpBp5vw7OJi1nCW9WlYhIr2PFC50wBM1H4ea4nLQIDAQAB
AoGAJWbcGiJgoiQEM9ynKcUwWrxZN8RIo7E1yKDCgpRZX5hdmWlvM0IFZcD82V//
yMtb9Xnt2TbvIl0ADV56LQ26gMfe93E6GniMeST9AOOVaGzFIF+vbpNxnIMZEqMQ
wXKxMHyFhUe+xkqESUmvpTexNKfdSA8ukEwZ8BmwK/jK5kECQQDWMwM4lZ4SwjPd
IjM893hqV82od9BLCdiVCHT7DKx4Rpcp2yNLnA/gp+PrJc3dEbs3nQE0NV78DkNr
oW/hiOIXAkEAzmw0OPRYdP5Kkq/EUlQSGo4vLPCChGJUD+6l5RZlxwgsNBEpyMoh
YPqM13SfzJM0due/V9flK2rVYYP8KqMfWwJBAJs2MdJR0E5lfPFzM8+svwvH/hVi
ZIPLaa5sh1/XSi6JcEX7LfM+7d5rqeMd7LORgqkE0veC6QYaS851F75E0xcCQHVO
AkNXgClEFSbU4dETW5JhuKdmKhWHN1Qyf233U3FO0KfqFP+49k0BNSZ/bQw5nzfv
LMqDswUAWjBna9bjCj8CQH30g2ivHYvWnihCGwIXZBMnXzTf3R/JaRX6+5KBy/T/
DatZafd1kdkDFLEB6VpXkA2yyRfmL9JMKbnezGjN8aU=
-----END RSA PRIVATE KEY-----",
                    "domain_name" => 'twakeapp.com',
                    "selector" => '1521790800.twakeapp'
                ]
            ],
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
            ]
        ];
    }

}