# Development install of Twake

#### Step 1

You will need docker-compose: [./install_docker_compose.md](./install_dependencies.md)

```
# Using the git repository
# sudo sysctl -w vm.max_map_count=262144 #For ElasticSearch in local
cd twake
cp docker-compose.yml.dist.dev docker-compose.yml
docker-compose up -d
docker-compose exec php php composer.phar install
docker-compose down
docker-compose up -d
docker-compose exec nginx yarn install
docker-compose exec nginx yarn dev-build
```

Twake will be running on port 8000.

#### Step 2

Please wait 5-10 minutes on the first run to let the database be initialized. You can monitor the startup of Twake here: `docker-compose logs -f php`

#### Step 3

Open a browser on `http://localhost:8000` and click on subscribe. When your subscription will end, the link to activate your account will be available into `docker-compose logs -f php`.

For instance, this is an example of activation link: http://localhost:8000/?verify_mail=1&m=my@mail.com&c=xxx-xxx-xxx&token=xxx

#### Step 4

Enjoy Twake on your server !

You can use our online SaaS offer on https://twake.app and you can contact us for prices and on-premise solutions on contact@twakeapp.com .

### Update Twake

```
cd twake
docker-compose stop
docker-compose pull
docker-compose up -d
```

### Configuration files

There are two configuration files available in the volume `configuration` :

```
configuration/Parameters.php
configuration/environment.js
```

Once updated, you must do a `docker-compose restart`

Default files can be found here :

[/twake/backend/core/app/Configuration/Parameters.php.dist](Parameters.php)

[/twake/frontend/src/app/environment/environment.js.dist](./install_dependencies.md)

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
