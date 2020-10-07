FROM node:12

MAINTAINER Romaric Mourgues <romaric.mourgues@twakeapp.com>

WORKDIR /twake-node/

COPY backend/node /twake-node/
COPY docker/twake-node/entrypoint.sh /

#Crontab
RUN apt-get update && apt-get install -y cron
ADD docker/twake-php/crontab /etc/cron.d/twake-cron
RUN chmod 0644 /etc/cron.d/twake-cron
RUN touch /var/log/cron.log

RUN npm i

RUN npm run build

RUN chmod 777 /entrypoint.sh
ENTRYPOINT /entrypoint.sh "$DEV"

EXPOSE 3000