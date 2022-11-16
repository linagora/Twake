---
description: More details about Twake configuration.
---

# ⚙️ Server configuration

### Detach the configuration and start using your own

Each configuration file is optional, if not given, Twake will fallback to default configuration.

#### Backend configuration

You can find an example of Twake configuration (default configuration) here: [https://github.com/TwakeApp/Twake/blob/main/twake/backend/node/config/default.json](https://github.com/TwakeApp/Twake/blob/main/twake/backend/node/config/default.json)

Copy the content of this file and put it in `[docker-compose.yml location]/configuration/backend-node/production.json`

> **Tip:** you can put a 'cert' directory with apns.cert keys (mobile push notifications) beside the backend-node/production.json file.

#### Backend configuration, PHP (only for scalable mode)

An example is available here: [https://github.com/TwakeApp/Twake/blob/main/twake/backend/core/app/Configuration/Parameters.php.dist](https://github.com/TwakeApp/Twake/blob/main/twake/backend/core/app/Configuration/Parameters.php.dist)

Copy the content of this file and put it in `[docker-compose.yml location]/configuration/backend/Parameters.php`

> **Tip:** you can also put a 'cert' directory with apns.cert keys (mobile push notifications) beside the Parameters.php file.

#### Frontend configuration (only for scalable mode)

You can find an example of Twake configuration (default configuration) here: [https://github.com/TwakeApp/Twake/blob/main/twake/frontend/src/app/environment/environment.ts.dist](https://github.com/TwakeApp/Twake/blob/main/twake/frontend/src/app/environment/environment.ts.dist)

Copy the content of this file and put it in `[docker-compose.yml location]/configuration/frontend/environment.ts`

#### After a configuration change

Each time you change the configuration, restart your docker container like this:&#x20;

```
# In mongodb mode
docker-compose restart node

# In full scalable mode
docker-compose restart nginx node
docker-compose exec nginx yarn build #If you have custom frontend configuration
```

::: warning
If you are using ScyllaDB (mandatory for any version before 2022) you must make sure ScyllaDB is started before to start the node container.

If your server is completely stoped you can use this command to make sure everything starts well:

&#x20;`docker-compose up -d scylladb; sleep 120; docker-compose up -d`
:::
