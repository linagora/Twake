FROM node:10
WORKDIR /WebsocketsServer
RUN npm install
COPY ./entrypoint.sh /
RUN chmod 0777 /entrypoint.sh
ENTRYPOINT /entrypoint.sh