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

chmod -R 777 /var/www
chmod -R 777 /tmp/
cron -f &
docker-php-entrypoint php-fpm
