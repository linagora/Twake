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

exec "$@"

<<<<<<< HEAD
chmod -R 777 /var/www &
chmod -R 777 /tmp/
rm -R /tmp/*
chmod -R 777 /twake-core/ &
=======
chmod -R 777 /var/www
chmod -R 777 /tmp/
chmod -R 777 /twake-core/
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

if test -f "/configuration/Parameters.php"; then
  cp /configuration/Parameters.php /twake-core/app/Configuration/Parameters.php
else
  cp /twake-core/app/Configuration/Parameters.php.dist /twake-core/app/Configuration/Parameters.php
fi

<<<<<<< HEAD
(php bin/console twake:schema:update; php bin/console twake:init; php bin/console twake:init_connector; php bin/console twake:mapping) &
=======
php bin/console twake:schema:update
php bin/console twake:mapping
php bin/console twake:init
php bin/console twake:init_connector
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

cron -f &
docker-php-entrypoint php-fpm
