#!/bin/bash

MOBILE_HOST="${MOBILE_HOST:-http://node:3000}"
NODE_HOST="${NODE_HOST:-http://node:3000}"
PHP_UPSTREAM="${PHP_UPSTREAM:-php:9000}"
export MOBILE_HOST
export NODE_HOST
export PHP_UPSTREAM
envsubst '$${MOBILE_HOST} $${NODE_HOST}' < /etc/nginx/sites-available/site.template > /etc/nginx/sites-enabled/site
echo "upstream php-upstream { server ${PHP_UPSTREAM}; }" > /etc/nginx/conf.d/upstream.conf

cron -f &
nginx -g "daemon off;"
