# Enable Jitsi Connector

## Installation

To enable jitsi and set as default app for all workspaces:

```
sudo docker-compose exec php php bin/console twake:init_connector jitsi enable default
```

## Configuration

In your app/Configuration/Parameters.php, update the key `defaults.connectors.jitsi` with the following optionnal configuration :

```
'jisti' => [
  'jitsi_domain' => 'meet.jit.si'
]
```
