FROM twaketech/php7.1-cassandra

MAINTAINER Romaric Mourgues <romaric.mourgues@twakeapp.com>

#Crontab
ADD docker/twake-php/crontab /etc/cron.d/twake-cron
RUN chmod 0644 /etc/cron.d/twake-cron
RUN touch /var/log/cron.log

RUN mkdir /twake-core/
COPY backend/core/ /twake-core/
RUN cd /twake-core/ && php composer.phar install

COPY docker/twake-php/entrypoint.sh /
RUN chmod 0777 /entrypoint.sh

#For exec
WORKDIR /twake-core/

ENTRYPOINT /entrypoint.sh "$DEV"
