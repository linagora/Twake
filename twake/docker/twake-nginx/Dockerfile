# nginx/Dockerfile
FROM debian:jessie

MAINTAINER Romaric Mourgues <romaric.mourgues@twakeapp.com>

RUN apt-get update && apt-get -y install cron

RUN apt-get update && apt-get install -y \
    nginx

RUN apt-get update && apt-get install -y wget

ADD ./site.conf /etc/nginx/sites-enabled/site
ADD ./nginx.conf /etc/nginx/nginx.conf
RUN rm /etc/nginx/sites-enabled/default

RUN echo "upstream php-upstream { server php:9000; }" > /etc/nginx/conf.d/upstream.conf
#RUN echo "upstream php-backoffice-upstream { server php_backoffice:9000; }" > /etc/nginx/conf.d/upstream.conf

RUN usermod -u 1000 www-data

RUN wget https://dl.eff.org/certbot-auto
RUN chmod a+x certbot-auto
RUN apt-get update && apt-get install -y \
  augeas-lenses binutils cpp cpp-4.9 dh-python gcc gcc-4.9 libasan1 libatomic1 \
  libaugeas0 libc-dev-bin libc6-dev libcilkrts5 libcloog-isl4 libexpat1-dev \
  libffi-dev libgcc-4.9-dev libgomp1 libisl10 libitm1 liblsan0 libmpc3 \
  libmpdec2 libmpfr4 libpython-dev libpython-stdlib libpython2.7 \
  libpython2.7-dev libpython2.7-minimal libpython2.7-stdlib libpython3-stdlib \
  libpython3.4-minimal libpython3.4-stdlib libquadmath0 libsqlite3-0 \
  libssl-dev libtsan0 libubsan0 linux-libc-dev mime-support python \
  python-chardet-whl python-colorama-whl python-dev python-distlib-whl \
  python-html5lib-whl python-minimal python-pip-whl python-pkg-resources \
  python-requests-whl python-setuptools-whl python-six-whl python-urllib3-whl \
  python-virtualenv python2.7 python2.7-dev python2.7-minimal python3 \
  python3-minimal python3-pkg-resources python3-virtualenv python3.4 \
  python3.4-minimal virtualenv zlib1g-dev

#Crontab
ADD crontab /etc/cron.d/twake-cron
RUN chmod 0644 /etc/cron.d/twake-cron
RUN touch /var/log/cron.log

COPY ./entrypoint.sh /
RUN chmod 0777 /entrypoint.sh
ENTRYPOINT /entrypoint.sh

EXPOSE 80
EXPOSE 443
