---
description: You should update this security keys to ship Twake in production.
---

# 🔒 Security

> See how to [Detach Configuration](./) first.

The following keys must be updated to increase Twake security in [docker-compose.yml location]/configuration/backend-node/production.json:

```json
{
  "phpnode": {
    "secret": "xxx" // Secret for PHP<->Node communication, deprecated like PHP
  },
  "websocket": {
    "auth": {
      "jwt": {
        "secret": "xxx" // JWT secret for websockets
      }
    }
  },
  "auth": {
    "jwt": {
      "secret": "xxx" // JWT secret
    }
  },
  "database": {
    "secret": "xxx" // Db app layer encryption key
  },
  "storage": {
    "secret": "xxx", // Storage app layer encryption key
    "iv": "xxx" // Storage app layer encryption iv
  }
}
```

The following keys must be updated to increase Twake security in /configuration/backend/Parameters.php:

```text
"env" => [
  "secret" => "somesecret", //Any string
],
...
"websocket" => [
  ...
  "pusher_public" //Generate public and private key
  "pusher_private" //Put private key here
],
"db" => [
  ...
  "encryption_key" //Any string
]
...
"storage" => [
  ...
  "drive_salt" => "SecretPassword", //Any string
],
...
```
