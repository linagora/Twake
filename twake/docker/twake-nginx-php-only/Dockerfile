# nginx/Dockerfile
FROM twaketech/nginx-static-yarn

MAINTAINER Romaric Mourgues <romaric.mourgues@twakeapp.com>

ADD docker/twake-nginx/site.conf /etc/nginx/sites-available/site.template
ADD docker/twake-nginx-php-only/nginx.conf /etc/nginx/nginx.conf
RUN apt-get update && apt-get install gettext-base

RUN echo "upstream php-upstream { server php:9000; }" > /etc/nginx/conf.d/upstream.conf

COPY docker/twake-nginx-php-only/entrypoint.sh /
RUN chmod 0777 /entrypoint.sh
ENTRYPOINT /entrypoint.sh

EXPOSE 80
EXPOSE 443
