# Installing Twake with LemonLDAP

### 1. Twake configuration

Edit Twake PHP config `twake/backend/core/app/Configuration/Parameters.php`

```
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

### 2. Lemon LDAP configuration

Dans ClientOpenIDConnect > twake > Options > Basique > Adresse connexion :
http://15.236.209.74/ajax/users/openid

Dans ClientOpenIDConnect > twake > Attributs exportés :
email_verified, picture, name (=>cn), given_name (=>givenName), family_name (=>sn), email (=>mail), sub (=>uid)

[Ne marche pas pour le moment]
Dans ClientOpenIDConnect > twake > Options > Déconnexion > Adresse :
http://15.236.209.74/ajax/users/openid/logout_success

### 3. Twake vendors

[Monkey fix for now because id_token is null with LemonLDAP]

Change file `vendor/jumbojett/openid-connect-php/src/OpenIDConnectClient.php` line 284 :

```
if (!property_exists($token_json, 'id_token')) {
    throw new OpenIDConnectClientException("User did not authorize openid scope.");
}

$claims = $this->decodeJWT($token_json->id_token, 1);

// Verify the signature
if ($this->canVerifySignatures()) {
     if (!$this->getProviderConfigValue('jwks_uri')) {
        throw new OpenIDConnectClientException ("Unable to verify signature due to no jwks_uri being defined");
    }
    if (!$this->verifyJWTsignature($token_json->id_token)) {
        throw new OpenIDConnectClientException ("Unable to verify signature");
    }
} else {
    user_error("Warning: JWT signature verification unavailable.");
}

// If this is a valid claim
if ($this->verifyJWTclaims($claims, $token_json->access_token)) {
```

to

```
if (true) {
```
