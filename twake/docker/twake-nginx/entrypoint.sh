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

MOBILE_HOST="${MOBILE_HOST:-http://node:3000}"
NODE_HOST="${NODE_HOST:-http://node:3000}"
PHP_UPSTREAM="${PHP_UPSTREAM:-php-upstream}"
export MOBILE_HOST
export NODE_HOST
export PHP_UPSTREAM
envsubst '$${MOBILE_HOST} $${NODE_HOST}' < /etc/nginx/sites-available/site.template > /etc/nginx/sites-enabled/site
echo "upstream php-upstream { server ${PHP_UPSTREAM}; }" > /etc/nginx/conf.d/upstream.conf

cron -f &
nginx -g "daemon off;"
