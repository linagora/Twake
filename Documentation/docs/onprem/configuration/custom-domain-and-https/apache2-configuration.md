---
description: "\U0001F64F From Dahpril (community) https://github.com/TwakeApp/Twake/issues/76"
---

# Apache2 configuration

#### Apache vhost

You need to create a vhost listening on port 443.

_For exemple with certbot :_

_1. Create a vhost listening on port 80 with ServerName equals to your custom domain. Don't define any document root. 2. Then, use certbot to get a certificate and automatically create your vhost listening on port 443_

```text
sudo certbot --apache --email your_email -d your_domain --agree-tos --redirect --noninteractive
```

#### Reverse proxy

You have now to configure your reverse proxy directive. Head up to your 443 vhost configuration file and paste those directives \(place them after server and ssl directives\) :

```text
RewriteEngine on
RewriteCond ${HTTP:Upgrade} websocket [NC]
RewriteCond ${HTTP:Connection} upgrade [NC]
RewriteRule .* "wss://127.0.0.1:8000/$1" [P,L]

ProxyRequests off

<Location />
    ProxyPass http://127.0.0.1:8000/
    ProxyPassReverse http://127.0.0.1:8000/
    ProxyPreserveHost On
</Location>
<Location /socketcluster>
    ProxyPass ws://127.0.0.1:8000/socketcluster
    ProxyPassReverse ws://127.0.0.1:8000/socketcluster
    ProxyPreserveHost On
</Location>

<Proxy *>
    AllowOverride All
    Order allow,deny
    Allow from All
</Proxy>

RequestHeader set X-Forwarded-port "80"
```

Be careful to NOT type trailing slash for ws location \(it won't work\).

I'm not sure that all directives are needed, but this configuration works for me.

#### Configuring remoteip

You also need to configure remoteip mod from apache with this command :

```text
a2enmod remoteip
```

Then, edit /etc/apache2/conf-available/remoteip.conf to fit with this content :

```text
RemoteIPHeader X-Real-IP
RemoteIPTrustedProxy 127.0.0.1 ::1
```

You can now enable the configuration of remoteip and restart Apache :

```text
a2enconf remoteip
service apache2 restart
```

Return to the section "Configure domain name" of [Custom domain + HTTPS](./README.md#configure-domain-name) page to continue the configuration.
