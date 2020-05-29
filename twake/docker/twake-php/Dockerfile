# See https://github.com/docker-library/php/blob/master/7.1/fpm/Dockerfile
FROM php:7.1-fpm-stretch
ARG TIMEZONE
ARG APCU_VERSION=5.1.11

MAINTAINER Romaric Mourgues <romaric.mourgues@twakeapp.com>

# Set timezone
RUN ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone
RUN printf '[PHP]\ndate.timezone = "%s"\n', ${TIMEZONE} > /usr/local/etc/php/conf.d/tzone.ini
RUN "date"

RUN apt-get update && apt-get -y install cron

RUN apt-get update && apt-get install -y \
    openssl \
    git \
    unzip

RUN apt-get update -y && apt-get install -y libpng-dev

#MBSTRING
RUN docker-php-ext-install mbstring

RUN apt-get update && apt-get install -y \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libmcrypt-dev \
        libpng-dev \
    && docker-php-ext-install -j$(nproc) iconv mcrypt \
    && docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/ \
    && docker-php-ext-install -j$(nproc) gd

#ENCRYPTION
RUN apt-get update -y
RUN apt-get install libsodium-dev -y
RUN pecl install -f libsodium-2.0.8
RUN docker-php-ext-enable sodium

#ZIP
RUN apt-get update && \
    apt-get install -y \
        zlib1g-dev
RUN docker-php-ext-install zip

#GD images
RUN apt-get update && apt-get install -y \
		libfreetype6-dev \
		libjpeg62-turbo-dev \
		libpng-dev \
	&& docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/ \
	&& docker-php-ext-install -j$(nproc) gd

#ZMQ
RUN apt-get update && apt-get install -y zlib1g-dev libzmq3-dev wget git \
    && pecl install zmq-beta \
    && docker-php-ext-install zip \
    && docker-php-ext-enable zmq

#Imagick
RUN apt-get update && apt-get -y install ghostscript && apt-get clean
RUN apt-get update && apt-get install -y libmagickwand-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN pecl install imagick && docker-php-ext-enable imagick

#Unoconv
RUN apt-get update && apt-get install -y --force-yes unoconv libxml2-dev
RUN docker-php-ext-install soap
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer --version

# Type docker-php-ext-install to see available extensions
RUN docker-php-ext-install pdo pdo_mysql

# Add cassandra driver
ENV INSTALL_DIR /usr/src/datastax-php-driver
#RUN apt-get update && apt-get install -y libgmp-dev libpcre3-dev g++ make cmake libssl-dev openssl
#RUN wget http://downloads.datastax.com/cpp-driver/ubuntu/16.04/dependenices/libuv/v1.8.0/libuv_1.8.0-1_amd64.deb && wget http://downloads.datastax.com/cpp-driver/ubuntu/16.04/dependenices/libuv/v1.8.0/libuv-dev_1.8.0-1_amd64.deb && wget http://downloads.datastax.com/cpp-driver/ubuntu/16.04/v2.4.1/cassandra-cpp-driver_2.4.1-1_amd64.deb && wget http://downloads.datastax.com/cpp-driver/ubuntu/16.04/v2.4.1/cassandra-cpp-driver-dev_2.4.1-1_amd64.deb
#RUN dpkg -i libuv_1.8.0-1_amd64.deb && dpkg -i libuv-dev_1.8.0-1_amd64.deb && dpkg -i cassandra-cpp-driver-dev_2.4.1-1_amd64.deb && dpkg -i cassandra-cpp-driver_2.4.1-1_amd64.deb

RUN apt-get update && apt-get install -y libgmp-dev libpcre3-dev g++ make cmake libssl-dev openssl
RUN wget http://downloads.datastax.com/cpp-driver/ubuntu/16.04/dependencies/libuv/v1.8.0/libuv_1.8.0-1_amd64.deb && wget http://downloads.datastax.com/cpp-driver/ubuntu/16.04/dependencies/libuv/v1.8.0/libuv-dev_1.8.0-1_amd64.deb && wget http://downloads.datastax.com/cpp-driver/ubuntu/16.04/cassandra/v2.4.1/cassandra-cpp-driver_2.4.1-1_amd64.deb && wget http://downloads.datastax.com/cpp-driver/ubuntu/16.04/cassandra/v2.4.1/cassandra-cpp-driver-dev_2.4.1-1_amd64.deb
#RUN apt-get update && apt-get install -y libssl
RUN echo "deb http://security.debian.org/debian-security jessie/updates main" >> /etc/apt/sources.list
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    libssl1.0.0
RUN dpkg -i --force-overwrite libuv_1.8.0-1_amd64.deb && dpkg -i --force-overwrite libuv-dev_1.8.0-1_amd64.deb && dpkg -i --force-overwrite cassandra-cpp-driver_2.4.1-1_amd64.deb && dpkg -i --force-overwrite cassandra-cpp-driver-dev_2.4.1-1_amd64.deb

RUN apt-get update && apt-get install -y cmake autoconf g++ gcc make openssl libssl-dev libuv1-dev libgmp-dev \
    && apt-get install -y libgmp10
RUN git clone https://github.com/datastax/php-driver.git $INSTALL_DIR \
    && cd $INSTALL_DIR \
    && git submodule update --init
RUN cd ext && ./install.sh \
    && docker-php-ext-enable cassandra \
    && rm -rf $INSTALL_DIR

RUN pecl install apcu-${APCU_VERSION} && docker-php-ext-enable apcu
RUN echo "extension=apcu.so" >> /usr/local/etc/php/php.ini
RUN echo "apc.enable_cli=1" >> /usr/local/etc/php/php.ini
RUN echo "apc.enable=1" >> /usr/local/etc/php/php.ini

RUN echo 'alias sf="php app/console"' >> ~/.bashrc
RUN echo 'alias sf3="php bin/console"' >> ~/.bashrc

ADD uploads.ini /usr/local/etc/php/conf.d/uploads.ini

ADD www.conf /usr/local/etc/php-fpm.d/

#Crontab
ADD crontab /etc/cron.d/twake-cron
RUN chmod 0644 /etc/cron.d/twake-cron
RUN touch /var/log/cron.log

COPY ./entrypoint.sh /
RUN chmod 0777 /entrypoint.sh
ENTRYPOINT /entrypoint.sh

#For exec
WORKDIR /twake-core/
