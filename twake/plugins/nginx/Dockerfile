FROM nginx:latest

#RUN rm /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY . /usr/share/nginx/html/
COPY nginx.conf /etc/nginx


VOLUME /usr/share/nginx/html
VOLUME /etc/nginx

EXPOSE 8080:80