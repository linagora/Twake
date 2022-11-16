---
description: 'Harder than KeyCloak but has other features, see official LemonLDAP site.'
---

# Installing Twake with LemonLDAP \(LDAP, OpenID and more\)

#### 1. Twake configuration

Edit Twake PHP config `twake/backend/core/app/Configuration/Parameters.php`, in defaults.auth.openid

```text
"openid" => [
    "use" => true,
    "provider_uri" => 'http://auth.open-paas.org.local',
    "client_id" => 'twake',
    "client_secret" => 'secret',
    "ignore_mail_verified" => true,
    "ignore_id_token_verification" => true,
    "provider_config" => [
      "token_endpoint"=> "http://auth.open-paas.org.local/oauth2/token", //token_endpoint
      "userinfo_endpoint" => "http://auth.open-paas.org.local/oauth2/userinfo",//userinfo_endpoint
      "end_session_endpoint" => "http://auth.open-paas.org.local/oauth2/logout",//end_session_endpoint
      "authorization_endpoint" => "http://auth.open-paas.org.local/oauth2/authorize",//authorization_endpoint
    ]

],
```

Add line to /etc/hosts if needed :

`sudo docker-compose exec php bash -c "echo '51.210.124.92 manager.open-paas.org.local auth.open-paas.org.local reload.open-paas.org.local' >> /etc/hosts"`

#### 2. Lemon LDAP configuration

Dans ClientOpenIDConnect &gt; twake &gt; Options &gt; Basique &gt; Adresse connexion : [http://15.236.209.74/ajax/users/openid](http://15.236.209.74/ajax/users/openid)

Dans ClientOpenIDConnect &gt; twake &gt; Attributs exportés :

```text
{
  email_verified: email_verified,
  picture: picture,
  name: cn,
  given_name: givenName,
  family_name: sn,
  email: mail,
  sub: uid
}
```

\[Ne marche pas pour le moment\] Dans ClientOpenIDConnect &gt; twake &gt; Options &gt; Déconnexion &gt; Adresse : [http://15.236.209.74/ajax/users/openid/logout\_success](http://15.236.209.74/ajax/users/openid/logout_success)

