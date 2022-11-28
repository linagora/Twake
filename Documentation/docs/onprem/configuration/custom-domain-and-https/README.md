---
description: Use a custom domain with Twake
---

# 🔗 Custom domain + HTTPS



{% hint style="info" %}
We do not offer the possibility to edit the nginx configuration present in the docker-compose containers yet. To enable https you first need to install nginx and configure on your machine.

Your nginx installation will be used to forward the requests from https to the docker-compose http port.

The last step is to tell Twake that the frontend is accessed from a different domain and protocol to handle the redirections.
{% endhint %}

#### Use port 80 or 443 over https

To use 443 create a new nginx install and attach a proxy to port 8000 + certauto.  
If you use Apache2 go on the [Apache2 configuration page](apache2-configuration.md).

> Follow this thread if you have issues with websockets and reverse proxy: [https://community.twake.app/t/twake-on-docker-behind-apache-proxy/78](https://community.twake.app/t/twake-on-docker-behind-apache-proxy/78)

```text
# /etc/nginx/site-enabled/default
location / {
    proxy_pass http://127.0.0.1:8000;
}

location /socketcluster/ {
    proxy_pass http://127.0.0.1:8000/socketcluster/;
    # this magic is needed for WebSocket
    proxy_http_version  1.1;
    proxy_set_header    Upgrade $http_upgrade;
    proxy_set_header    Connection "upgrade";
    proxy_set_header    Host $http_host;
    proxy_set_header    X-Real-IP $remote_addr;
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
}
```

#### Configure domain name

You must edit the configuration in both `configuration/frontend/environment.ts` and `configuration/backend/Parameters.php`

```text
//Exemple of environment.ts
export default {
  env_dev: false,
  mixpanel_enabled: false,
  sentry_dsn: false,
  mixpanel_id: false,
  front_root_url: 'https://twake.acme.com',
  api_root_url: 'https://twake.acme.com',
  websocket_url: 'wss://twake.acme.com'
};
```

```text
//To change in Parameters.php
...
"env" => [
    ...
    "server_name" => "https://twake.acme.com/",
],
...
```

> Dont forget to restart your docker-compose 😉 and rebuild the frontend:  
> `docker-compose exec nginx yarn build`



