FROM nginx:latest

RUN rm /etc/nginx/conf.d/default.conf

COPY . /usr/share/nginx/html/
COPY /host/nginx.conf /etc/nginx


VOLUME /usr/share/nginx/html
VOLUME /etc/nginx

EXPOSE 8080:80
