---
description: You should update this security keys to ship Twake in production.
---

# 🔒 Security

> See how to [Detach Configuration](./) first.

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



