---
description: Use Keycloak with Twake
---

# Using Keycloak \(LDAP, OpenID and more\)

#### Run keycloak and persist data

```text
cd twake
docker run -p 8080:8080 -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin -v $(pwd)/docker-data/keycloak-db:/opt/jboss/keycloak/standalone/data jboss/keycloak
```

#### Configure keycloak with twake for the first time

**On Keycloak**

Go to `http://localhost:8080/auth/`

Login with admin:admin

Go to client &gt; account &gt; Credentials tab and save the `Secret`

Go to Settings tab and add a Valid Redirect uri to `http://localhost:8000/*` and save

Then create an user in User / Add User

⚠️ Users must have an email and the email must be marked as verified !

Then create a password for this user.

**On Twake**

Go to your \[docker-compose file location\]/configuration/backend/Parameters.php \(see [Configuration](../)\)

Change defaults.auth.openid to:

```text
  "use" => true,
  "provider_uri" => 'http://[machine_ip]:8080/auth/realms/master',
  "client_id" => 'account',
  "client_secret" => '[keycloak_secret]',
  "logout_suffix" => "/protocol/openid-connect/logout" //Specific to keycloak
```

ℹ️ \[machine\_ip\] Because Twake is accessing keycloak for inside a docker container, do not use localhost or 127.0.0.1 to access keycloak.

