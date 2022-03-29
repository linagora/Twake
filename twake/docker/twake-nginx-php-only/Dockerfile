
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

RUN apt-get update && apt-get install -y \
    augeas-lenses binutils cpp cpp-8 dh-python gcc gcc-8 libasan5 libatomic1 \
    libaugeas0 libc-dev-bin libc6-dev libcilkrts5 libexpat1-dev \
    libffi-dev libgcc-8-dev libgomp1 libisl19 libitm1 liblsan0 libmpc3 \
    libmpdec2 libmpfr6 libpython-dev libpython-stdlib libpython2.7 \
    libpython2.7-dev libpython2.7-minimal libpython2.7-stdlib libpython3-stdlib \
    libpython3.7-minimal libpython3.7-stdlib libquadmath0 libsqlite3-0 \
    libssl-dev libtsan0 libubsan0 linux-libc-dev mime-support python \
    python-chardet python-colorama python-dev python-distlib \
    python-html5lib python-minimal python-pip-whl python-pkg-resources \
    python-requests python-setuptools python-six python-urllib3 \
    python-virtualenv python2.7 python2.7-dev python2.7-minimal python3 \
    python3-minimal python3-pkg-resources python3-virtualenv python3.7 \
    python3.7-minimal virtualenv zlib1g-dev


ADD ./nginx.conf /etc/nginx/nginx.conf

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

# Install php

ADD docker/twake-nginx/site.conf /etc/nginx/sites-available/site.template
ADD docker/twake-nginx-php-only/nginx.conf /etc/nginx/nginx.conf
RUN apt-get update && apt-get install gettext-base

RUN echo "upstream php-upstream { server php:9000; }" > /etc/nginx/conf.d/upstream.conf

COPY docker/twake-nginx-php-only/entrypoint.sh /
RUN chmod 0777 /entrypoint.sh
ENTRYPOINT /entrypoint.sh

EXPOSE 80
EXPOSE 443
