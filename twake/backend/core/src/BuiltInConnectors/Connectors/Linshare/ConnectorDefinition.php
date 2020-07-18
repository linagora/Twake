<?php
namespace BuiltInConnectors\Connectors\Linshare;

class ConnectorDefinition
{
  public $configuration = [
      'domain' => '',
      'key' => [
        "issuer" => "Twake",
        "private" => "-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgHpJ/MAWh52lMCOt4btMb06LHAXn3BrrQoKrZ5IEPPLKqGwl7MVn
X6r+wEtMX5MmTQ68JHb4ohVVjKiJyySql/GXNcwGmx8jhTpFBzOTRDJBm60Z8wz3
G4Uy0IPWt1TRz4oiS9V5cC69ZpvxOQd/yaeN9BDkI/Tda4fDOa3PRINRAgMBAAEC
gYA1+uzf2dIZS26ZgUrQQ6gqcot3K+bj1w9v4LuCH+7LeZuoyYDfjocTUwqM8nSJ
3vFK3M/32D6rziydxN1wHQGench+cfR8yun8V9EV7Y5bTIX8DwMvLGvBkZT0u5Ai
J3g6JkWZTQHdthbOyADCgv7OxCjLrq9egE6py2R5cqk4NQJBALayivwy3WizoKNl
hpTdnIngyUbQnRd/3Enx50qaM3qGjyIpENOsNBhJQDtfQf82MRjAhrrsPSDmGvjL
HXFpqNsCQQCrWrIoGx68e//A5GR8dK7XfxBYaTPsXEXQD3uvegFxYxJJj26Qw8lx
i6XKA2lZKuAiyISrk1UWezG/gCzkF5ZDAkBCyDjtv1oXr7GEiNQNDoTuEXEBpbgG
owJPNVGqf3tZyl3/yqsP9N6GEiCck1F4jMKdnaKiKUCfCf3J+9UjY9AJAkA14SPJ
xpVIkPjfLzGFjK75ZaO/GP1RocX14Rh0GbngbFVwud/7NwTdZhqwRZhXiErHxSMq
S/5iPkRrQaNb6Sq/AkEAqQIOghY6T0SPrKfj+utFJMe0YchSU/bjApyE6U3pj1Vf
JZ7e+kO+wtORxj1bDh9nE6YEvW/fOY6/Sw+HoyYW9w==
-----END RSA PRIVATE KEY-----",
        "public" => "-----BEGIN PUBLIC KEY-----
MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgHpJ/MAWh52lMCOt4btMb06LHAXn
3BrrQoKrZ5IEPPLKqGwl7MVnX6r+wEtMX5MmTQ68JHb4ohVVjKiJyySql/GXNcwG
mx8jhTpFBzOTRDJBm60Z8wz3G4Uy0IPWt1TRz4oiS9V5cC69ZpvxOQd/yaeN9BDk
I/Tda4fDOa3PRINRAgMBAAE=
-----END PUBLIC KEY-----"
      ]
  ];

  public $definition = [
      'app_group_name' => 'linshare',
      'categories' => [ 'files' ],
      'name' => 'Linshare',
      'simple_name' => 'linshare',
      'description' => 'Linshare allows you to send Linshare documents into Twake messages.',
      'icon_url' => 'linshare.jpg',
      'website' => 'https://www.linshare.org/',
      'privileges' => [],
      'capabilities' =>
      [
        "messages_save",
        'display_modal',
      ],
      'hooks' => [],
      'display' => [
        "messages_module" => [
          "in_plus" => [
            "should_wait_for_popup" => true
          ]
        ],
        "configuration" => [
          "can_configure_in_workspace" => true
        ]
      ],
      'api_allowed_ips' => '*',
      'api_event_url' => '/event'
  ];
}
