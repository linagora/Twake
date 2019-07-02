# See https://github.com/docker-library/php/blob/master/7.1/fpm/Dockerfile
FROM php:7.1-fpm-stretch
ARG TIMEZONE

MAINTAINER Romaric Mourgues <romaric.mourgues@twakeapp.com>

RUN apt-get update && apt-get -y install cron

RUN apt-get update && apt-get install -y \
    openssl

#MBSTRING
RUN docker-php-ext-install mbstring

#ENCRYPTION
RUN apt-get update -y
RUN apt-get install libsodium-dev -y
RUN pecl install -f libsodium-2.0.8
RUN docker-php-ext-enable sodium


#ZMQ
RUN apt-get update && apt-get install -y zlib1g-dev libzmq3-dev wget git \
    && pecl install zmq-beta \
    && docker-php-ext-install zip \
    && docker-php-ext-enable zmq

# Set timezone
RUN ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone
RUN printf '[PHP]\ndate.timezone = "%s"\n', ${TIMEZONE} > /usr/local/etc/php/conf.d/tzone.ini
RUN "date"

# Type docker-php-ext-install to see available extensions
RUN docker-php-ext-install pdo pdo_mysql

RUN echo 'alias sf="php app/console"' >> ~/.bashrc
RUN echo 'alias sf3="php bin/console"' >> ~/.bashrc

#For exec
WORKDIR /twake-core/

#Crontab
ADD crontab /etc/cron.d/twake-cron
RUN chmod 0644 /etc/cron.d/twake-cron
RUN touch /var/log/cron.log

COPY ./entrypoint.sh /
RUN chmod 0777 /entrypoint.sh
ENTRYPOINT /entrypoint.sh
