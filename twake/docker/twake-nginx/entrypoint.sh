#!/bin/bash

if [ "$1" = "dev" ]
then
  if test -f "/twake-react/src/app/environment/environment.ts"; then
    echo "Configuration exists, doing nothing."
  else
    cp /twake-react/src/app/environment/environment.ts.dist.dev /twake-react/src/app/environment/environment.ts
  fi
else
  if test -f "/configuration/environment.ts"; then
    cp /configuration/environment.ts /twake-react/src/app/environment/environment.ts
  else
    cp /twake-react/src/app/environment/environment.ts.dist /twake-react/src/app/environment/environment.ts
  fi
fi

function _selfsigned() {
    self-signed.sh
    export NGINX_LISTEN="443 ssl"
    ln -sf /etc/nginx/sites-available/redirect /etc/nginx/sites-enabled/
}

case $SSL_CERTS in
  selfsigned)
    _selfsigned
    ;;
  off|no|non|none|false)
    export NGINX_LISTEN="80"
    sed -i '/ *ssl_/d' /etc/nginx/sites-available/site.template
    ;;
  *)
    echo: "SSL_CERTS var not defined setting selfsigned"
    export SSL_CERTS=selfsigned
    _selfsigned
    ;;
esac

NODE_HOST="${NODE_HOST:-http://node:3000}"
PHP_UPSTREAM="${PHP_UPSTREAM:-php:9000}"
export NODE_HOST
export PHP_UPSTREAM
envsubst '$${NODE_HOST} $${NGINX_LISTEN}' < /etc/nginx/sites-available/site.template > /etc/nginx/sites-enabled/site
echo "upstream php-upstream { server ${PHP_UPSTREAM}; }" > /etc/nginx/conf.d/upstream.conf

# Symlink stdout and stderr to logs file for docker log collector
# See https://github.com/nginxinc/docker-nginx/blob/456bf337ceb922a207651aa7c6077a316c3e368c/mainline/debian/Dockerfile#L99-L100
ln -sf /dev/stdout /var/log/nginx/access.log && \
  ln -sf /dev/stderr /var/log/nginx/error.log

cron -f &
nginx -g "daemon off;"
