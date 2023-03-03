# syntax=docker/dockerfile:1


FROM docker:20.10.17-dind-alpine3.16 


RUN apk add --update nodejs-current npm bash curl

WORKDIR /usr/src/app

COPY plugins/ .

VOLUME /usr/src/app
RUN chmod -R +x scripts
RUN mv scripts/* /bin
RUN apk update
RUN apk add  git

# SYNC API
WORKDIR /usr/src/app/api
RUN npm install
#RUN npm run build
ENTRYPOINT ["npm", "run", "start:dev"]









