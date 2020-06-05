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

### New account without mail configured

If mails aren't sent, you can find the subscribe account link in the php container logs :

`docker-compose logs -f --tail 100 php`

# Other links

[./auth_connectors/install_lemon.md](./auth_connectors/install_lemon.md)

[./auth_connectors/install_keycloak.md](./auth_connectors/install_keycloak.md)
