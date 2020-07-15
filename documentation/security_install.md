# Updating Twake security

The following keys must be updated to increase Twake security in /app/Configuration/Parameters.php:

```
"DRIVE_SALT" => "SecretPassword", //Any string
"secret" => "somesecret", //Any string
"websocket" => [
  "pusher_public" //Generate public and private key
  "pusher_private" //Put private key here
],
"db" => [
  "encryption_key" //Any string
]
```
