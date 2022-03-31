FROM debian:11

RUN apt-get update && apt-get -y install cron

RUN apt-get update && apt-get install -y \
    nginx

RUN apt-get update && apt-get install -y wget

RUN rm /etc/nginx/sites-enabled/default

RUN usermod -u 1000 www-data

RUN apt-get remove certbot
RUN apt-get install -y python3 python3-venv libaugeas0
RUN python3 -m venv /opt/certbot/
RUN /opt/certbot/bin/pip install --upgrade pip
RUN /opt/certbot/bin/pip install certbot
RUN ln -s /opt/certbot/bin/certbot /usr/bin/certbot

ADD docker/twake-nginx/nginx.conf /etc/nginx/nginx.conf

# Install yarn
RUN apt-get update
RUN apt-get -y install curl
RUN apt-get -y install apt-transport-https ca-certificates apt-utils gnupg
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update
RUN apt-get -y install yarn
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs
RUN yarn global add webpack
RUN yarn global add webpack-cli
RUN apt-get update
RUN apt-get -y install git

# Install frontend

WORKDIR /twake-react/

ADD docker/twake-nginx/site.conf /etc/nginx/sites-available/site.template
ADD docker/twake-nginx/redirect.conf /etc/nginx/sites-available/redirect
ADD docker/twake-nginx-php-only/nginx.conf /etc/nginx/nginx.conf
RUN apt-get update && apt-get install gettext-base
RUN echo "upstream php-upstream { server php:9000; }" > /etc/nginx/conf.d/upstream.conf

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
