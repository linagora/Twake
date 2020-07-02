<?php
namespace BuiltInConnectors\Connectors\Jitsi;

class ConnectorDefinition
{
  public $configuration = [
    'jitsi_domain' => 'meet.jit.si'
  ];

  public $definition = [
      'app_group_name' => 'twake',
      'categories' => [ 'voice_video' ],
      'name' => 'Jitsi',
      'simple_name' => 'jitsi',
      'description' => 'Jitsi allows you to create and join video calls directly from Twake.',
      'icon_url' => 'jitsi.png',
      'website' => 'https://twake.app',
      'privileges' => [],
      'capabilities' =>
      [
        'messages_send',
        'display_modal',
        'messages_save',
      ],
      'hooks' => [],
      'display' =>
      [
        'messages_module' =>
        [
          'right_icon' => true,
          'commands' =>
          [
            [
              'command' => 'Meeting name',
              'description' => 'Create a Jisti call',
            ]
          ]
        ]
      ],
      'api_allowed_ips' => '*',
      'api_event_url' => '/event'
  ];
}
