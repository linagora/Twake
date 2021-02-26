FROM twaketech/nginx-static-yarn

MAINTAINER Romaric Mourgues <romaric.mourgues@twakeapp.com>

ADD docker/twake-nginx/site.conf /etc/nginx/sites-enabled/site

RUN echo "upstream php-upstream { server php:9000; }" > /etc/nginx/conf.d/upstream.conf
#RUN echo "upstream php-backoffice-upstream { server php_backoffice:9000; }" > /etc/nginx/conf.d/upstream.conf

WORKDIR /twake-react/

COPY frontend /twake-react/
RUN cp /twake-react/src/app/environment/environment.ts.dist /twake-react/src/app/environment/environment.ts
RUN yarn install --network-timeout 1000000000
ENV GENERATE_SOURCEMAP false
RUN cat /twake-react/src/app/environment/environment.ts.dist
RUN cat /twake-react/src/app/environment/environment.ts
RUN yarn build

RUN cp /twake-react/src/app/environment/environment.ts.dist /environment.ts.dist

COPY docker/twake-nginx/entrypoint.sh /
RUN chmod 0777 /entrypoint.sh
ENTRYPOINT /entrypoint.sh "$DEV"

EXPOSE 80
EXPOSE 443
