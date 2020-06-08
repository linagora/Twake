# Installing Twake (manual installation)

### Dependencies

`docker 19.03.8`, `docker-compose 1.25.5`, `yarn 1.6.0`, `node 10.16.3`, `webpack`

Procedure here :

[./install_dependencies.md](./install_dependencies.md)

### Installation / update

```
cd twake
./install.sh
```

### Start

```
cd twake
./start.sh
```

Twake will be running on port 8000.

### Use port 80 or 443 over https

To use 443 use a nginx layer with a proxy to port 8000 + certauto

```
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

### Configure domain name

You must edit configuration at `backend/core/app/Configuration/Parameters.php` and `frontend/src/app/environment/environment.js`.

Both configurations contains localhost:8000 route by default, replace by your own domain if needed.

/!\ http / https matter in these configuration

### Configure security keys

[./security_install.md](./security_install.md)

### New account without mail configured

If mails aren't sent, you can find the subscribe account link in the php container logs :

`docker-compose logs -f --tail 100 php`

# Other links

[./auth_connectors/install_lemon.md](./auth_connectors/install_lemon.md)

[./auth_connectors/install_keycloak.md](./auth_connectors/install_keycloak.md)
