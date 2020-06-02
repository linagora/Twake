# Installing Twake (manual installation)

### Dependencies

`docker 19.03.8`, `docker-compose 1.25.5`, `yarn 1.6.0`, `node 10.16.3`

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

# Using Keycloak

### Run keycloak and persist data

```
cd twake
docker run -p 8080:8080 -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin -v $(pwd)/docker-data/keycloak-db:/opt/jboss/keycloak/standalone/data jboss/keycloak
```

### Configure keycloak with twake for the first time

#### On Keycloak

Go to `http://localhost:8080/auth/`

Login with admin:admin

Go to client > account > Credentials tab and save the `Secret`

Go to Settings tab and add a Valid Redirect uri to `http://localhost:8000/*` and save

Then create an user in User / Add User

⚠️ Users must have an email and the email must be marked as verified !

Then create a password for this user.

#### On Twake

Go to backend/core/app/Configuration/Parameters.php

Change auth.openid to:

```
  "use" => true,
  "provider_uri" => 'http://[machine_ip]:8080/auth/realms/master',
  "client_id" => 'account',
  "client_secret" => '[keycloak_secret]',
  "logout_suffix" => "/protocol/openid-connect/logout" //Specific to keycloak
```

ℹ️ [machine_ip] Because Twake is accessing keycloak for inside a docker container, do not use localhost or 127.0.0.1 to access keycloak.

### Reset Twake

Reseting Twake is easy in dev mode, just delete the docker-data directory.

```
./stop.sh
cd twake/
rm -R docker-data/
./install.sh
```
