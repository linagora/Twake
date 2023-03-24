FROM twaketech/php7.1-cassandra

LABEL org.opencontainers.image.authors="Romaric Mourgues <romaric.mourgues@twakeapp.com>,Nguyen Thai <tknguyen@linagora.com>"

#Crontab
ADD docker/twake-php/crontab /etc/cron.d/twake-cron
COPY backend/core/ /twake-core/
COPY docker/twake-php/entrypoint.sh /

RUN chmod 0644 /etc/cron.d/twake-cron && \
    touch /var/log/cron.log && \
    cd /twake-core/ && php composer.phar install && \
    chmod +x /entrypoint.sh

#For exec
WORKDIR /twake-core/

ENTRYPOINT ["/entrypoint.sh", "$DEV"]
