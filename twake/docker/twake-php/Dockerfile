FROM php:7.1.11-fpm

MAINTAINER Romaric Mourgues <romaric.mourgues@twakeapp.com>

ARG TIMEZONE
ARG APCU_VERSION=5.1.11

# Set timezone
RUN ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime
RUN echo ${TIMEZONE} > /etc/timezone
RUN printf '[PHP]\ndate.timezone = "%s"\n', ${TIMEZONE} > /usr/local/etc/php/conf.d/tzone.ini
RUN "date"

RUN apt-get update && apt-get install -y cron

RUN apt-get update && apt-get install -y \
    openssl \
    git \
    unzip

RUN apt-get update && apt-get install -y libpng-dev

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

#ZIP
RUN apt-get update && apt-get install -y  zlib1g-dev
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
RUN apt-get update && apt-get install -y ghostscript && apt-get clean
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

ENV CASSANDRA_PHP_DRIVER_VERSION 1.3.2

RUN rm /var/lib/apt/lists/* -vrf && \
    apt-get clean && apt-get update

RUN apt-get update && \
    apt-get install -y git wget libssl-dev zlib1g-dev libicu-dev g++ make cmake libuv-dev libgmp-dev uuid-dev && \
    apt-get autoclean -y && \
    apt-get clean -y

# Install datastax php-driver fox cassandra
RUN git clone https://github.com/datastax/php-driver.git /usr/src/datastax-php-driver && \
    cd /usr/src/datastax-php-driver && \
    git checkout --detach v${CASSANDRA_PHP_DRIVER_VERSION} && \
    git submodule update --init && \
    cd ext && \
    ./install.sh && \
    echo extension=cassandra.so > /usr/local/etc/php/conf.d/cassandra.ini

# Install PHP extensions
RUN docker-php-ext-install zip mbstring intl opcache bcmath && \
    echo extension=bcmath.so > /usr/local/etc/php/conf.d/docker-php-ext-bcmath.ini && \
    apt-get install -y php5-xdebug && \
    echo zend_extension=xdebug.so > /usr/local/etc/php/conf.d/xdebug.ini && \
    pecl install apcu-5.1.5 && \
    echo extension=apcu.so > /usr/local/etc/php/conf.d/apcu.ini && \
    pecl install uuid && \
    echo extension=uuid.so > /usr/local/etc/php/conf.d/uuid.ini


RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php && php -r "unlink('composer-setup.php');" \
    && mv composer.phar /usr/local/bin/composer

## Cleanup
RUN apt-get purge -y \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

#ACPU
RUN pecl install apcu-${APCU_VERSION} && docker-php-ext-enable apcu
RUN echo "extension=apcu.so" >> /usr/local/etc/php/php.ini
RUN echo "apc.enable_cli=1" >> /usr/local/etc/php/php.ini
RUN echo "apc.enable=1" >> /usr/local/etc/php/php.ini

RUN echo 'alias sf="php app/console"' >> ~/.bashrc
RUN echo 'alias sf3="php bin/console"' >> ~/.bashrc

ADD docker/twake-php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

ADD docker/twake-php/www.conf /usr/local/etc/php-fpm.d/

#Crontab
ADD docker/twake-php/crontab /etc/cron.d/twake-cron
RUN chmod 0644 /etc/cron.d/twake-cron
RUN touch /var/log/cron.log

#ENCRYPTION
RUN apt-get update && apt-get install -y git
RUN git clone https://github.com/jedisct1/libsodium --branch stable
RUN cd libsodium && ./configure && make && make check && make install
RUN pecl install -f libsodium
RUN echo "extension = sodium.so" >> /usr/local/etc/php/php.ini

#Sockets for amqp
RUN docker-php-ext-install sockets

RUN mkdir /twake-core/
COPY backend/core/ /twake-core/
RUN cd /twake-core/ && php composer.phar install

COPY docker/twake-php/entrypoint.sh /
RUN chmod 0777 /entrypoint.sh

#For exec
WORKDIR /twake-core/

ENTRYPOINT /entrypoint.sh "$DEV"
