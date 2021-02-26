#!/bin/sh

if [ -z "$TIMEZONE"  ]; then
    TIMEZONE=Etc/UTC
fi

echo $TIMEZONE > /etc/timezone && \
dpkg-reconfigure -f noninteractive tzdata

sed -i "s|;date.timezone =.*|date.timezone = $TIMEZONE|" /etc/php5/*/php.ini

if [ -n "$PHP_MEMORY_LIMIT"  ]; then
    sed -i "s/^memory_limit =.*/memory_limit = $PHP_MEMORY_LIMIT/" /etc/php5/*/php.ini
fi

chmod -R 777 /var/www &
chmod -R 777 /tmp/
rm -R /tmp/*
chmod -R 777 /twake-core/ &
mkdir /twake-core/cache
chmod -R 777 /twake-core/cache &

if [ "$1" = "dev" ]
then
  if test -f "/twake-core/app/Configuration/Parameters.php"; then
    echo "Configuration exists, doing nothing."
  else
    cp /twake-core/app/Configuration/Parameters.php.dist /twake-core/app/Configuration/Parameters.php
  fi

  php composer.phar install
else
  if test -f "/configuration/Parameters.php"; then
    cp /configuration/Parameters.php /twake-core/app/Configuration/Parameters.php
  else
    cp /twake-core/app/Configuration/Parameters.php.dist /twake-core/app/Configuration/Parameters.php
  fi
fi

(php composer.phar dump-autoload --optimize;  php composer.phar dump-autoload --classmap-authoritative; php composer.phar dump-autoload --apcu; php bin/console twake:schema:update; php bin/console twake:init; php bin/console twake:init_connector; php bin/console twake:mapping) &

mkdir /twake-core/cache
chmod -R 777 /twake-core/cache &

echo "" >> /etc/cron.d/twake-cron

cron -f &
docker-php-entrypoint php-fpm
