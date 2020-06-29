<?php
namespace BuiltInConnectors\Connectors\Linshare;

class ConnectorDefinition
{
  public $configuration = [
      'domain' => 'https://user.linshare-2-3.integration-linshare.org/'
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
        "messages_send",
        'display_modal',
      ],
      'hooks' => [],
      'display' => [
        "messages_module" => [
          "in_plus" => [
            "should_wait_for_popup" => true
          ]
        ]
      ],
      'api_allowed_ips' => '*',
      'api_event_url' => '/event'
  ];
}
