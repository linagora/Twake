# nginx/Dockerfile
FROM debian:buster

MAINTAINER Romaric Mourgues <romaric.mourgues@twakeapp.com>

RUN apt-get update && apt-get -y install cron

RUN apt-get update && apt-get install -y \
    nginx

RUN apt-get update && apt-get install -y wget

ADD docker/twake-nginx-php-only/site.conf /etc/nginx/sites-enabled/site
ADD docker/twake-nginx-php-only/nginx.conf /etc/nginx/nginx.conf
RUN rm /etc/nginx/sites-enabled/default

RUN echo "upstream php-upstream { server php:9000; }" > /etc/nginx/conf.d/upstream.conf

RUN usermod -u 1000 www-data

RUN wget https://dl.eff.org/certbot-auto
RUN chmod a+x certbot-auto
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


COPY docker/twake-nginx-php-only/entrypoint.sh /
RUN chmod 0777 /entrypoint.sh
ENTRYPOINT /entrypoint.sh

EXPOSE 80
EXPOSE 443
