FROM twaketech/nginx-static-yarn

MAINTAINER Romaric Mourgues <romaric.mourgues@twakeapp.com>

ADD docker/twake-nginx/site.conf /etc/nginx/sites-available/site.template
ADD docker/twake-nginx/redirect.conf /etc/nginx/sites-available/redirect
ADD docker/twake-nginx-php-only/nginx.conf /etc/nginx/nginx.conf
RUN apt-get update && apt-get install gettext-base
RUN echo "upstream php-upstream { server php:9000; }" > /etc/nginx/conf.d/upstream.conf

WORKDIR /twake-react/

COPY frontend /twake-react/
RUN cp /twake-react/src/app/environment/environment.ts.dist /twake-react/src/app/environment/environment.ts
RUN yarn install --network-timeout 1000000000
ENV GENERATE_SOURCEMAP false
RUN cat /twake-react/src/app/environment/environment.ts.dist
RUN cat /twake-react/src/app/environment/environment.ts
ENV GENERATE_SOURCEMAP=false
RUN yarn build
RUN rm -R node_modules

RUN cp /twake-react/src/app/environment/environment.ts.dist /environment.ts.dist

COPY docker/twake-nginx/entrypoint.sh /
COPY docker/twake-nginx/self-signed.sh /usr/local/bin/
RUN chmod 0777 /entrypoint.sh
ENTRYPOINT /entrypoint.sh "$DEV"

EXPOSE 80
EXPOSE 443
