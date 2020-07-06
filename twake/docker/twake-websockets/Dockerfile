FROM node:10
WORKDIR /WebsocketsServer
COPY docker/twake-websockets/entrypoint.sh /
RUN chmod 0777 /entrypoint.sh
COPY backend/websockets_server/ /WebsocketsServer/
RUN npm install
ENTRYPOINT /entrypoint.sh

RUN ls
