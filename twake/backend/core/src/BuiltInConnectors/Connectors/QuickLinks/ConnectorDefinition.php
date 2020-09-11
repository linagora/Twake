<?php
namespace BuiltInConnectors\Connectors\QuickLinks;

use BuiltInConnectors\Common\BaseConnectorDefinition;

class ConnectorDefinition extends BaseConnectorDefinition
{
  public function setDefinition(){
      $main_service = $this->app->getServices()->get("connectors.common.main");

      $this->definition = [
        'app_group_name' => 'twake',
        'categories' => [],
        'name' => 'QuickLinks',
        'simple_name' => 'quicklinks',
        'description' => 'QuickLinks allows you to create and manage links for channel or personnal usage.',
        'icon_url' => 'quicklinks.svg',
        'website' => 'https://twake.app',
        'privileges' => [],
        'member_app' => true,
        'capabilities' =>
        [
          'messages_send',
          'display_modal',
          'messages_save',
        ],
        'hooks' => [],
        'display' =>
        [
          'channel_tab' => [
            'iframe' => $main_service->getServerBaseUrl() . '/quicklinks/app/'
          ],
          'messages_module' =>
          [
            'right_icon' => true,
            'commands' =>
            [
              [
                'command' => '"name" "scope" "url"',
                'description' => 'Manage quick links',
              ],
            ]
          ]
        ],
        'api_allowed_ips' => '*',
        'api_event_url' => '/event'
    ];
  }

  public function getDefinition(){
    $this->setDefinition();
    return $this->definition;
  }

  public function getConfiguration(){
    $this->setConfiguration();
    return $this->configuration;
  }
}
